-- Comprehensive French translations for the entire application
INSERT INTO translations (language, key, value) VALUES
-- Navigation and Core UI
('fr', 'nav.home', 'Accueil'),
('fr', 'nav.rooms', 'Chambres'),
('fr', 'nav.conference', 'Conférence'),
('fr', 'nav.dining', 'Restauration'),
('fr', 'nav.contact', 'Contact'),
('fr', 'nav.about', 'À Propos'),
('fr', 'nav.sign_in', 'Se Connecter'),
('fr', 'nav.my_bookings', 'Mes Réservations'),

-- Authentication
('fr', 'auth.email', 'Email'),
('fr', 'auth.password', 'Mot de passe'),
('fr', 'auth.name', 'Nom'),
('fr', 'auth.phone', 'Téléphone'),
('fr', 'auth.sign_in', 'Se Connecter'),
('fr', 'auth.sign_up', 'S''inscrire'),
('fr', 'auth.sign_out', 'Se Déconnecter'),
('fr', 'auth.login', 'Connexion'),
('fr', 'auth.register', 'Inscription'),
('fr', 'auth.forgot_password', 'Mot de passe oublié'),
('fr', 'auth.staff_login', 'Connexion Personnel'),
('fr', 'auth.client_login', 'Connexion Client'),

-- Dashboard Common
('fr', 'dashboard.welcome', 'Bienvenue'),
('fr', 'dashboard.overview', 'Aperçu'),
('fr', 'dashboard.stats', 'Statistiques'),
('fr', 'dashboard.quick_actions', 'Actions Rapides'),
('fr', 'dashboard.recent_activity', 'Activité Récente'),
('fr', 'dashboard.notifications', 'Notifications'),

-- Admin Dashboard
('fr', 'admin.dashboard', 'Tableau de Bord Admin'),
('fr', 'admin.user_management', 'Gestion des Utilisateurs'),
('fr', 'admin.room_management', 'Gestion des Chambres'),
('fr', 'admin.booking_overview', 'Aperçu des Réservations'),
('fr', 'admin.reports', 'Rapports'),
('fr', 'admin.settings', 'Paramètres'),
('fr', 'admin.conference_rooms', 'Salles de Conférence'),
('fr', 'admin.menu_management', 'Gestion du Menu'),
('fr', 'admin.payment_management', 'Gestion des Paiements'),
('fr', 'admin.content_management', 'Gestion du Contenu'),

-- Reception Dashboard
('fr', 'reception.dashboard', 'Tableau de Bord Réception'),
('fr', 'reception.guest_management', 'Gestion des Clients'),
('fr', 'reception.room_status', 'État des Chambres'),
('fr', 'reception.check_in', 'Enregistrement'),
('fr', 'reception.check_out', 'Départ'),
('fr', 'reception.guest_services', 'Services Clients'),
('fr', 'reception.maintenance', 'Maintenance'),
('fr', 'reception.phone_directory', 'Annuaire Téléphonique'),

-- Restaurant Dashboard
('fr', 'restaurant.dashboard', 'Tableau de Bord Restaurant'),
('fr', 'restaurant.orders', 'Commandes'),
('fr', 'restaurant.kitchen', 'Cuisine'),
('fr', 'restaurant.menu', 'Menu'),
('fr', 'restaurant.tables', 'Tables'),
('fr', 'restaurant.promotions', 'Promotions'),
('fr', 'restaurant.create_order', 'Créer une Commande'),
('fr', 'restaurant.manage_menu', 'Gérer le Menu'),
('fr', 'restaurant.table_management', 'Gestion des Tables'),

-- Booking System
('fr', 'booking.title', 'Réservation'),
('fr', 'booking.select_room', 'Sélectionner une Chambre'),
('fr', 'booking.check_in_date', 'Date d''Arrivée'),
('fr', 'booking.check_out_date', 'Date de Départ'),
('fr', 'booking.guests', 'Invités'),
('fr', 'booking.total_price', 'Prix Total'),
('fr', 'booking.confirm', 'Confirmer'),
('fr', 'booking.cancel', 'Annuler'),
('fr', 'booking.status', 'Statut'),
('fr', 'booking.details', 'Détails'),
('fr', 'booking.payment', 'Paiement'),

-- Room Management
('fr', 'room.available', 'Disponible'),
('fr', 'room.occupied', 'Occupée'),
('fr', 'room.maintenance', 'Maintenance'),
('fr', 'room.cleaning', 'Nettoyage'),
('fr', 'room.type', 'Type de Chambre'),
('fr', 'room.price', 'Prix'),
('fr', 'room.amenities', 'Équipements'),
('fr', 'room.description', 'Description'),
('fr', 'room.capacity', 'Capacité'),
('fr', 'room.size', 'Taille'),

-- Orders and Restaurant
('fr', 'order.pending', 'En Attente'),
('fr', 'order.preparing', 'En Préparation'),
('fr', 'order.ready', 'Prêt'),
('fr', 'order.delivered', 'Livré'),
('fr', 'order.cancelled', 'Annulé'),
('fr', 'order.number', 'Numéro de Commande'),
('fr', 'order.items', 'Articles'),
('fr', 'order.total', 'Total'),
('fr', 'order.payment_method', 'Méthode de Paiement'),

-- Common Actions
('fr', 'common.add', 'Ajouter'),
('fr', 'common.edit', 'Modifier'),
('fr', 'common.delete', 'Supprimer'),
('fr', 'common.save', 'Enregistrer'),
('fr', 'common.cancel', 'Annuler'),
('fr', 'common.confirm', 'Confirmer'),
('fr', 'common.view', 'Voir'),
('fr', 'common.search', 'Rechercher'),
('fr', 'common.filter', 'Filtrer'),
('fr', 'common.sort', 'Trier'),
('fr', 'common.loading', 'Chargement...'),
('fr', 'common.error', 'Erreur'),
('fr', 'common.success', 'Succès'),
('fr', 'common.close', 'Fermer'),
('fr', 'common.back', 'Retour'),
('fr', 'common.next', 'Suivant'),
('fr', 'common.previous', 'Précédent'),

-- Status
('fr', 'status.active', 'Actif'),
('fr', 'status.inactive', 'Inactif'),
('fr', 'status.pending', 'En Attente'),
('fr', 'status.approved', 'Approuvé'),
('fr', 'status.rejected', 'Rejeté'),
('fr', 'status.completed', 'Terminé'),

-- Forms
('fr', 'form.required', 'Requis'),
('fr', 'form.optional', 'Optionnel'),
('fr', 'form.invalid', 'Invalide'),
('fr', 'form.valid', 'Valide'),
('fr', 'form.submit', 'Soumettre'),
('fr', 'form.reset', 'Réinitialiser'),

-- Tables
('fr', 'table.no_data', 'Aucune donnée'),
('fr', 'table.rows_per_page', 'Lignes par page'),
('fr', 'table.page', 'Page'),
('fr', 'table.of', 'de'),
('fr', 'table.first', 'Premier'),
('fr', 'table.last', 'Dernier'),

-- Date/Time
('fr', 'date.today', 'Aujourd''hui'),
('fr', 'date.yesterday', 'Hier'),
('fr', 'date.tomorrow', 'Demain'),
('fr', 'time.morning', 'Matin'),
('fr', 'time.afternoon', 'Après-midi'),
('fr', 'time.evening', 'Soir'),
('fr', 'time.night', 'Nuit')

ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;

-- English translations (fallback)
INSERT INTO translations (language, key, value) VALUES
-- Navigation and Core UI
('en', 'nav.home', 'Home'),
('en', 'nav.rooms', 'Rooms'),
('en', 'nav.conference', 'Conference'),
('en', 'nav.dining', 'Dining'),
('en', 'nav.contact', 'Contact'),
('en', 'nav.about', 'About'),
('en', 'nav.sign_in', 'Sign In'),
('en', 'nav.my_bookings', 'My Bookings'),

-- Authentication
('en', 'auth.email', 'Email'),
('en', 'auth.password', 'Password'),
('en', 'auth.name', 'Name'),
('en', 'auth.phone', 'Phone'),
('en', 'auth.sign_in', 'Sign In'),
('en', 'auth.sign_up', 'Sign Up'),
('en', 'auth.sign_out', 'Sign Out'),
('en', 'auth.login', 'Login'),
('en', 'auth.register', 'Register'),
('en', 'auth.forgot_password', 'Forgot Password'),
('en', 'auth.staff_login', 'Staff Login'),
('en', 'auth.client_login', 'Client Login'),

-- Dashboard Common
('en', 'dashboard.welcome', 'Welcome'),
('en', 'dashboard.overview', 'Overview'),
('en', 'dashboard.stats', 'Statistics'),
('en', 'dashboard.quick_actions', 'Quick Actions'),
('en', 'dashboard.recent_activity', 'Recent Activity'),
('en', 'dashboard.notifications', 'Notifications'),

-- Admin Dashboard
('en', 'admin.dashboard', 'Admin Dashboard'),
('en', 'admin.user_management', 'User Management'),
('en', 'admin.room_management', 'Room Management'),
('en', 'admin.booking_overview', 'Booking Overview'),
('en', 'admin.reports', 'Reports'),
('en', 'admin.settings', 'Settings'),
('en', 'admin.conference_rooms', 'Conference Rooms'),
('en', 'admin.menu_management', 'Menu Management'),
('en', 'admin.payment_management', 'Payment Management'),
('en', 'admin.content_management', 'Content Management'),

-- Reception Dashboard
('en', 'reception.dashboard', 'Reception Dashboard'),
('en', 'reception.guest_management', 'Guest Management'),
('en', 'reception.room_status', 'Room Status'),
('en', 'reception.check_in', 'Check In'),
('en', 'reception.check_out', 'Check Out'),
('en', 'reception.guest_services', 'Guest Services'),
('en', 'reception.maintenance', 'Maintenance'),
('en', 'reception.phone_directory', 'Phone Directory'),

-- Restaurant Dashboard
('en', 'restaurant.dashboard', 'Restaurant Dashboard'),
('en', 'restaurant.orders', 'Orders'),
('en', 'restaurant.kitchen', 'Kitchen'),
('en', 'restaurant.menu', 'Menu'),
('en', 'restaurant.tables', 'Tables'),
('en', 'restaurant.promotions', 'Promotions'),
('en', 'restaurant.create_order', 'Create Order'),
('en', 'restaurant.manage_menu', 'Manage Menu'),
('en', 'restaurant.table_management', 'Table Management'),

-- Booking System
('en', 'booking.title', 'Booking'),
('en', 'booking.select_room', 'Select Room'),
('en', 'booking.check_in_date', 'Check-in Date'),
('en', 'booking.check_out_date', 'Check-out Date'),
('en', 'booking.guests', 'Guests'),
('en', 'booking.total_price', 'Total Price'),
('en', 'booking.confirm', 'Confirm'),
('en', 'booking.cancel', 'Cancel'),
('en', 'booking.status', 'Status'),
('en', 'booking.details', 'Details'),
('en', 'booking.payment', 'Payment'),

-- Room Management
('en', 'room.available', 'Available'),
('en', 'room.occupied', 'Occupied'),
('en', 'room.maintenance', 'Maintenance'),
('en', 'room.cleaning', 'Cleaning'),
('en', 'room.type', 'Room Type'),
('en', 'room.price', 'Price'),
('en', 'room.amenities', 'Amenities'),
('en', 'room.description', 'Description'),
('en', 'room.capacity', 'Capacity'),
('en', 'room.size', 'Size'),

-- Orders and Restaurant
('en', 'order.pending', 'Pending'),
('en', 'order.preparing', 'Preparing'),
('en', 'order.ready', 'Ready'),
('en', 'order.delivered', 'Delivered'),
('en', 'order.cancelled', 'Cancelled'),
('en', 'order.number', 'Order Number'),
('en', 'order.items', 'Items'),
('en', 'order.total', 'Total'),
('en', 'order.payment_method', 'Payment Method'),

-- Common Actions
('en', 'common.add', 'Add'),
('en', 'common.edit', 'Edit'),
('en', 'common.delete', 'Delete'),
('en', 'common.save', 'Save'),
('en', 'common.cancel', 'Cancel'),
('en', 'common.confirm', 'Confirm'),
('en', 'common.view', 'View'),
('en', 'common.search', 'Search'),
('en', 'common.filter', 'Filter'),
('en', 'common.sort', 'Sort'),
('en', 'common.loading', 'Loading...'),
('en', 'common.error', 'Error'),
('en', 'common.success', 'Success'),
('en', 'common.close', 'Close'),
('en', 'common.back', 'Back'),
('en', 'common.next', 'Next'),
('en', 'common.previous', 'Previous'),

-- Status
('en', 'status.active', 'Active'),
('en', 'status.inactive', 'Inactive'),
('en', 'status.pending', 'Pending'),
('en', 'status.approved', 'Approved'),
('en', 'status.rejected', 'Rejected'),
('en', 'status.completed', 'Completed'),

-- Forms
('en', 'form.required', 'Required'),
('en', 'form.optional', 'Optional'),
('en', 'form.invalid', 'Invalid'),
('en', 'form.valid', 'Valid'),
('en', 'form.submit', 'Submit'),
('en', 'form.reset', 'Reset'),

-- Tables
('en', 'table.no_data', 'No data'),
('en', 'table.rows_per_page', 'Rows per page'),
('en', 'table.page', 'Page'),
('en', 'table.of', 'of'),
('en', 'table.first', 'First'),
('en', 'table.last', 'Last'),

-- Date/Time
('en', 'date.today', 'Today'),
('en', 'date.yesterday', 'Yesterday'),
('en', 'date.tomorrow', 'Tomorrow'),
('en', 'time.morning', 'Morning'),
('en', 'time.afternoon', 'Afternoon'),
('en', 'time.evening', 'Evening'),
('en', 'time.night', 'Night')

ON CONFLICT (language, key) DO UPDATE SET value = EXCLUDED.value;