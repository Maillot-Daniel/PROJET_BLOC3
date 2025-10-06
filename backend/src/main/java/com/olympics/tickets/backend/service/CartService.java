import com.olympics.tickets.backend.entity.Order;
import com.olympics.tickets.backend.entity.OrderItem;
import com.olympics.tickets.backend.repository.OrderRepository;
import com.olympics.tickets.backend.service.StripeService.Item;
import lombok.RequiredArgsConstructor;
import java.util.stream.Collectors;

// Ajoute dans les dépendances
private final StripeService stripeService;
        private final OrderRepository orderRepository;

        @Transactional
        public String checkoutCart(Long userId) throws Exception {
            Cart cart = cartRepository.findByUserIdAndActiveTrue(userId)
                    .orElseThrow(() -> new NotFoundException("Panier non trouvé"));

            if (cart.getItems() == null || cart.getItems().isEmpty()) {
                throw new IllegalStateException("Le panier est vide.");
            }

            // 1️⃣ Créer la commande
            Order order = new Order();
            order.setUser(cart.getUser());
            order.setStatus("PENDING");
            order.setCreatedAt(LocalDateTime.now());
            order.setItems(
                    cart.getItems().stream().map(cartItem -> {
                        OrderItem oi = new OrderItem();
                        oi.setOrder(order);
                        oi.setEventTitle(cartItem.getEvent().getTitle());
                        oi.setOfferTypeName(cartItem.getOfferType().getName());
                        oi.setQuantity(cartItem.getQuantity());
                        oi.setUnitPrice(cartItem.getUnitPrice());
                        oi.setTotalPrice(cartItem.getUnitPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
                        return oi;
                    }).collect(Collectors.toList())
            );
            order.setTotalPrice(cart.getItems().stream()
                    .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add));

            orderRepository.save(order);

            // 2️⃣ Préparer la session Stripe
            List<Item> stripeItems = cart.getItems().stream().map(i ->
                    new Item(i.getEvent().getTitle() + " - " + i.getOfferType().getName(),
                            i.getQuantity(),
                            i.getUnitPrice().multiply(BigDecimal.valueOf(100)).longValue()) // centimes
            ).collect(Collectors.toList());

            String successUrl = "https://tonfrontend.com/success";
            String cancelUrl = "https://tonfrontend.com/cancel";

            String stripeUrl = stripeService.createCheckoutSession(cart.getUser().getEmail(), stripeItems, successUrl, cancelUrl);

            // 3️⃣ Vider le panier
            cart.getItems().clear();
            cart.setActive(false);
            cart.setStatus(CartStatus.VALIDATED);
            cartRepository.save(cart);

            return stripeUrl;
        }
