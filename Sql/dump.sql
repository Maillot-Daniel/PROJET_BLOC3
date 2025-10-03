-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : sam. 27 sep. 2025 à 18:34
-- Version du serveur : 8.0.31
-- Version de PHP : 8.0.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `olympics_tickets`
--

-- --------------------------------------------------------

--
-- Structure de la table `cart`
--

DROP TABLE IF EXISTS `cart`;
CREATE TABLE IF NOT EXISTS `cart` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` tinyint(1) NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `status` enum('ACTIVE','ABANDONED','COMPLETED') DEFAULT 'ACTIVE',
  PRIMARY KEY (`id`),
  KEY `FKp7lk7eipat43e7j3f2nd7pdak` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `cart_item`
--

DROP TABLE IF EXISTS `cart_item`;
CREATE TABLE IF NOT EXISTS `cart_item` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `offer_type` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(19,4) DEFAULT NULL,
  `cart_id` bigint DEFAULT NULL,
  `event_id` bigint DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `total_price` decimal(19,4) GENERATED ALWAYS AS ((`unit_price` * `quantity`)) STORED,
  `event_title` varchar(255) DEFAULT NULL,
  `offer_type_name` varchar(255) DEFAULT NULL,
  `old_offer_type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK1uobyhgl1wvgt1jpccia8xxs3` (`cart_id`),
  KEY `FK2tvar3qo0xslg5i13jx9evbpy` (`event_id`),
  KEY `FKtc64y0e1ia8etarvunsrgwqpc` (`user_id`),
  KEY `fk_offer_type` (`offer_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `events`
--

DROP TABLE IF EXISTS `events`;
CREATE TABLE IF NOT EXISTS `events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `description` varchar(1000) NOT NULL,
  `date` datetime(6) NOT NULL,
  `location` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `remaining_tickets` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `category` varchar(50) DEFAULT NULL,
  `deleted` bit(1) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `total_tickets` int NOT NULL,
  `version` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_event_date` (`date`),
  KEY `idx_event_location` (`location`),
  KEY `idx_event_price` (`price`),
  KEY `idx_event_remaining_tickets` (`remaining_tickets`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `events`
--

INSERT INTO `events` (`id`, `title`, `description`, `date`, `location`, `price`, `remaining_tickets`, `created_at`, `updated_at`, `category`, `deleted`, `image_url`, `total_tickets`, `version`) VALUES
(41, 'Finale Natation 100m Papillon : Homme', 'Finale olympique avec les meilleurs nageurs mondiaux en lice pour l’or.', '2025-08-07 00:00:00.000000', 'Centre Aquatique Olympique, Saint-Denis', '120.00', 350, '2025-05-23 15:33:39', '2025-05-23 15:33:39', NULL, b'0', NULL, 350, 0),
(42, 'Demi-finale Football Féminin : Brésil vs États-Unis', 'Deux géants du football féminin s’affrontent pour une place en finale.\n📍 Lieu : Stade de Lyon (Groupama Stadium)', '2025-08-09 00:00:00.000000', 'Stade de Lyon (Groupama Stadium)', '135.00', 620, '2025-05-23 15:35:13', '2025-05-23 15:35:13', NULL, b'0', NULL, 620, 0),
(43, 'Finale Gymnastique Artistique : Sol Féminin', 'Les meilleures gymnastes mondiales s\'affrontent lors de la finale au sol, un moment de grâce et de puissance.', '2025-08-09 18:00:00.000000', 'Accor Arena, Paris', '100.00', 410, '2025-05-23 15:35:59', '2025-05-23 20:22:11', NULL, b'0', NULL, 410, 3),
(49, 'x', 'x', '2025-05-29 00:00:00.000000', 'Arena Bercy, Paris', '0.01', 2, '2025-05-23 20:22:39', '2025-05-23 20:22:39', NULL, b'0', NULL, 2, 0);

-- --------------------------------------------------------

--
-- Structure de la table `offer_types`
--

DROP TABLE IF EXISTS `offer_types`;
CREATE TABLE IF NOT EXISTS `offer_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `uk_offer_type_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `offer_types`
--

INSERT INTO `offer_types` (`id`, `name`) VALUES
(2, 'DUO'),
(3, 'FAMILLE'),
(1, 'SOLO');

-- --------------------------------------------------------

--
-- Structure de la table `ourusers`
--

DROP TABLE IF EXISTS `ourusers`;
CREATE TABLE IF NOT EXISTS `ourusers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `city` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Déchargement des données de la table `ourusers`
--

INSERT INTO `ourusers` (`id`, `city`, `email`, `name`, `password`, `role`) VALUES
(41, 'Paris', 'admin@gmail.com', 'admin', '$2a$10$8bZ6ZDdRUblEkIPthicJGeOzu8QdyB2lQtMT81wLV8MOrIr9tWgka', 'ADMIN'),
(49, 'Lévis', 'vanessa@gmail.com', 'Vanessa Maillot', '$2a$10$W5RIZTpLoW3v74u.URExS.LYocM840XJ1ekHXVu9N1B1qaplcvueO', 'USER');

-- --------------------------------------------------------

--
-- Structure de la table `ticket`
--

DROP TABLE IF EXISTS `ticket`;
CREATE TABLE IF NOT EXISTS `ticket` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ticket_number` varchar(255) NOT NULL,
  `qr_code_url` varchar(255) NOT NULL,
  `event_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `offer_type_id` int NOT NULL,
  `purchase_date` datetime NOT NULL,
  `validated` tinyint(1) NOT NULL DEFAULT '0',
  `quantity` int NOT NULL,
  `price` decimal(38,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ticket_number` (`ticket_number`),
  KEY `fk_ticket_event` (`event_id`),
  KEY `fk_ticket_user` (`user_id`),
  KEY `fk_ticket_offer` (`offer_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `ticket_backup`
--

DROP TABLE IF EXISTS `ticket_backup`;
CREATE TABLE IF NOT EXISTS `ticket_backup` (
  `id` bigint NOT NULL DEFAULT '0',
  `offer_type` int NOT NULL,
  `price` decimal(38,2) NOT NULL,
  `purchase_date` datetime NOT NULL,
  `qr_code_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `quantity` int NOT NULL,
  `ticket_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `validated` tinyint(1) NOT NULL DEFAULT '0',
  `event_id` bigint NOT NULL,
  `user_id` bigint NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `FKp7lk7eipat43e7j3f2nd7pdak` FOREIGN KEY (`user_id`) REFERENCES `ourusers` (`id`);

--
-- Contraintes pour la table `cart_item`
--
ALTER TABLE `cart_item`
  ADD CONSTRAINT `FK1uobyhgl1wvgt1jpccia8xxs3` FOREIGN KEY (`cart_id`) REFERENCES `cart` (`id`),
  ADD CONSTRAINT `FK2tvar3qo0xslg5i13jx9evbpy` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`),
  ADD CONSTRAINT `fk_offer_type` FOREIGN KEY (`offer_type`) REFERENCES `offer_types` (`id`),
  ADD CONSTRAINT `FKtc64y0e1ia8etarvunsrgwqpc` FOREIGN KEY (`user_id`) REFERENCES `ourusers` (`id`);

--
-- Contraintes pour la table `ticket`
--
ALTER TABLE `ticket`
  ADD CONSTRAINT `fk_ticket_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ticket_offer` FOREIGN KEY (`offer_type_id`) REFERENCES `offer_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ticket_user` FOREIGN KEY (`user_id`) REFERENCES `ourusers` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
