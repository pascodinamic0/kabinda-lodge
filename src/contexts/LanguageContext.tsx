import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type LanguageCode = 'fr' | 'en';

interface Translation {
  key: string;
  language: LanguageCode;
  value: string;
}

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setSystemLanguage: (language: LanguageCode) => void;
  translations: Record<string, string>;
  t: (key: string, fallback?: string) => string;
  isLoading: boolean;
  supportedLanguages: LanguageCode[];
  isLanguageReady: boolean;
  canChangeLanguage: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Comprehensive default translations
const defaultTranslations: Record<LanguageCode, Record<string, string>> = {
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.rooms': 'Chambres',
    'nav.conference': 'Salle de Conférence',
    'nav.about': 'À Propos',
    'nav.restaurant': 'Restaurant',
    'nav.contact': 'Contact',
    'nav.dashboard': 'Tableau de Bord',
    'nav.bookings': 'Réservations',
    'nav.users': 'Utilisateurs',
    'nav.reports': 'Rapports',
    'nav.settings': 'Paramètres',

    // Common Actions
    'action.save': 'Enregistrer',
    'action.cancel': 'Annuler',
    'action.delete': 'Supprimer',
    'action.edit': 'Modifier',
    'action.add': 'Ajouter',
    'action.view': 'Voir',
    'action.close': 'Fermer',
    'action.confirm': 'Confirmer',
    'action.back': 'Retour',
    'action.next': 'Suivant',
    'action.previous': 'Précédent',
    'action.submit': 'Soumettre',
    'action.search': 'Rechercher',
    'action.filter': 'Filtrer',
    'action.sort': 'Trier',
    'action.refresh': 'Actualiser',
    'action.print': 'Imprimer',
    'action.download': 'Télécharger',
    'action.upload': 'Téléverser',

    // Status
    'status.pending': 'En Attente',
    'status.approved': 'Approuvé',
    'status.rejected': 'Rejeté',
    'status.completed': 'Terminé',
    'status.cancelled': 'Annulé',
    'status.active': 'Actif',
    'status.inactive': 'Inactif',
    'status.available': 'Disponible',
    'status.occupied': 'Occupé',
    'status.maintenance': 'Maintenance',
    'status.cleaning': 'Nettoyage',

    // Dashboard
    'dashboard.welcome': 'Bienvenue',
    'dashboard.overview': 'Aperçu',
    'dashboard.stats': 'Statistiques',
    'dashboard.recent_activity': 'Activité Récente',
    'dashboard.quick_actions': 'Actions Rapides',
    'dashboard.total_users': 'Total Utilisateurs',
    'dashboard.total_rooms': 'Total Chambres',
    'dashboard.total_bookings': 'Total Réservations',
    'dashboard.total_revenue': 'Revenu Total',
    'dashboard.pending_orders': 'Commandes en Attente',
    'dashboard.available_tables': 'Tables Disponibles',
    'dashboard.active_menu_items': 'Articles de Menu Actifs',

    // Booking
    'booking.new': 'Nouvelle Réservation',
    'booking.edit': 'Modifier Réservation',
    'booking.details': 'Détails de Réservation',
    'booking.confirm': 'Confirmer Réservation',
    'booking.cancel': 'Annuler Réservation',
    'booking.check_in': 'Arrivée',
    'booking.check_out': 'Départ',
    'booking.guest_name': 'Nom du Client',
    'booking.guest_email': 'Email du Client',
    'booking.guest_phone': 'Téléphone du Client',
    'booking.room_type': 'Type de Chambre',
    'booking.room_number': 'Numéro de Chambre',
    'booking.nights': 'Nuits',
    'booking.total_amount': 'Montant Total',
    'booking.payment_method': 'Méthode de Paiement',
    'booking.transaction_ref': 'Référence Transaction',
    'booking.booking_id': 'ID de Réservation',
    'booking.booking_date': 'Date de Réservation',
    'booking.booking_status': 'Statut de Réservation',

    // Room
    'room.available': 'Disponible',
    'room.occupied': 'Occupée',
    'room.maintenance': 'Maintenance',
    'room.cleaning': 'Nettoyage',
    'room.standard': 'Standard',
    'room.deluxe': 'Deluxe',
    'room.suite': 'Suite',
    'room.presidential': 'Présidentielle',
    'room.price_per_night': 'Prix par Nuit',
    'room.amenities': 'Équipements',
    'room.description': 'Description',
    'room.capacity': 'Capacité',
    'room.size': 'Taille',
    'room.view': 'Vue',

    // Restaurant
    'restaurant.menu': 'Menu',
    'restaurant.order': 'Commande',
    'restaurant.orders': 'Commandes',
    'restaurant.new_order': 'Nouvelle Commande',
    'restaurant.order_details': 'Détails de Commande',
    'restaurant.order_status': 'Statut de Commande',
    'restaurant.order_total': 'Total de Commande',
    'restaurant.table_number': 'Numéro de Table',
    'restaurant.item_name': 'Nom de l\'Article',
    'restaurant.item_price': 'Prix de l\'Article',
    'restaurant.item_quantity': 'Quantité',
    'restaurant.item_total': 'Total Article',
    'restaurant.subtotal': 'Sous-total',
    'restaurant.tax': 'Taxe',
    'restaurant.discount': 'Remise',
    'restaurant.grand_total': 'Total Général',
    'restaurant.payment_method': 'Méthode de Paiement',
    'restaurant.cash': 'Espèces',
    'restaurant.card': 'Carte',
    'restaurant.mobile_money': 'Mobile Money',

    // Conference Room
    'conference.room': 'Salle de Conférence',
    'conference.rooms': 'Salles de Conférence',
    'conference.booking': 'Réservation Salle',
    'conference.bookings': 'Réservations Salles',
    'conference.room_name': 'Nom de la Salle',
    'conference.capacity': 'Capacité',
    'conference.price_per_day': 'Prix par Jour',
    'conference.booking_date': 'Date de Réservation',
    'conference.start_time': 'Heure de Début',
    'conference.end_time': 'Heure de Fin',
    'conference.attendees': 'Participants',
    'conference.notes': 'Notes',

    // Receipt
    'receipt.title': 'FACTURE',
    'receipt.company_name': 'KABINDA LODGE',
    'receipt.booking_receipt': 'FACTURE',
    'receipt.receipt_date': 'Date de Reçu',
    'receipt.booking_id': 'ID de Réservation',
    'receipt.guest_name': 'Nom du Client',
    'receipt.guest_email': 'Email du Client',
    'receipt.guest_phone': 'Téléphone du Client',
    'receipt.room_name': 'Nom de la Chambre',
    'receipt.room_type': 'Type de Chambre',
    'receipt.check_in': 'Arrivée',
    'receipt.check_out': 'Départ',
    'receipt.nights': 'Nuits',
    'receipt.room_price': 'Prix de la Chambre',
    'receipt.total_amount': 'Montant Total',
    'receipt.payment_method': 'Méthode de Paiement',
    'receipt.transaction_ref': 'Référence Transaction',
    'receipt.promotion': 'Promotion',
    'receipt.discount': 'Remise',
    'receipt.subtotal': 'Sous-total',
    'receipt.tax': 'Taxe',
    'receipt.grand_total': 'Total Général',
    'receipt.thank_you': 'Merci d\'avoir choisi Kabinda Lodge. Nous espérons que vous apprécierez votre séjour !',
    'receipt.contact_info': 'Pour toute question, veuillez contacter notre réception.',
    'receipt.company_tagline': 'Kabinda Lodge - Expérience d\'Hospitalité de Luxe',

    // Restaurant Receipt
    'restaurant_receipt.title': 'REÇU DE RESTAURANT',
    'restaurant_receipt.order_receipt': 'REÇU DE COMMANDE',
    'restaurant_receipt.order_id': 'ID de Commande',
    'restaurant_receipt.order_date': 'Date de Commande',
    'restaurant_receipt.table_number': 'Numéro de Table',
    'restaurant_receipt.items': 'Articles',
    'restaurant_receipt.quantity': 'Quantité',
    'restaurant_receipt.price': 'Prix',
    'restaurant_receipt.total': 'Total',
    'restaurant_receipt.thank_you': 'Merci pour votre commande !',

    // User Management
    'user.profile': 'Profil',
    'user.settings': 'Paramètres',
    'user.logout': 'Déconnexion',
    'user.login': 'Connexion',
    'user.register': 'Inscription',
    'user.email': 'Email',
    'user.password': 'Mot de Passe',
    'user.confirm_password': 'Confirmer Mot de Passe',
    'user.first_name': 'Prénom',
    'user.last_name': 'Nom',
    'user.phone': 'Téléphone',
    'user.role': 'Rôle',
    'user.admin': 'Administrateur',
    'user.receptionist': 'Réceptionniste',
    'user.restaurant_lead': 'Chef de Restaurant',
    'user.kitchen': 'Cuisine',
    'user.super_admin': 'Super Administrateur',

    // Messages
    'message.success': 'Succès',
    'message.error': 'Erreur',
    'message.warning': 'Avertissement',
    'message.info': 'Information',
    'message.confirm': 'Confirmer',
    'message.cancel': 'Annuler',
    'message.yes': 'Oui',
    'message.no': 'Non',
    'message.ok': 'OK',
    'message.loading': 'Chargement...',
    'message.saving': 'Enregistrement...',
    'message.deleting': 'Suppression...',
    'message.please_wait': 'Veuillez patienter...',

    // Form Labels
    'form.required': 'Requis',
    'form.optional': 'Optionnel',
    'form.email': 'Adresse Email',
    'form.password': 'Mot de Passe',
    'form.confirm_password': 'Confirmer Mot de Passe',
    'form.first_name': 'Prénom',
    'form.last_name': 'Nom',
    'form.phone': 'Téléphone',
    'form.address': 'Adresse',
    'form.city': 'Ville',
    'form.country': 'Pays',
    'form.postal_code': 'Code Postal',
    'form.notes': 'Notes',
    'form.description': 'Description',
    'form.title': 'Titre',
    'form.category': 'Catégorie',
    'form.price': 'Prix',
    'form.quantity': 'Quantité',
    'form.date': 'Date',
    'form.time': 'Heure',
    'form.start_date': 'Date de Début',
    'form.end_date': 'Date de Fin',

    // Time
    'time.today': 'Aujourd\'hui',
    'time.yesterday': 'Hier',
    'time.tomorrow': 'Demain',
    'time.this_week': 'Cette Semaine',
    'time.last_week': 'Semaine Dernière',
    'time.this_month': 'Ce Mois',
    'time.last_month': 'Mois Dernier',
    'time.this_year': 'Cette Année',
    'time.last_year': 'Année Dernière',

    // Months
    'month.january': 'Janvier',
    'month.february': 'Février',
    'month.march': 'Mars',
    'month.april': 'Avril',
    'month.may': 'Mai',
    'month.june': 'Juin',
    'month.july': 'Juillet',
    'month.august': 'Août',
    'month.september': 'Septembre',
    'month.october': 'Octobre',
    'month.november': 'Novembre',
    'month.december': 'Décembre',

    // Days
    'day.monday': 'Lundi',
    'day.tuesday': 'Mardi',
    'day.wednesday': 'Mercredi',
    'day.thursday': 'Jeudi',
    'day.friday': 'Vendredi',
    'day.saturday': 'Samedi',
    'day.sunday': 'Dimanche',

    // Errors
    'error.general': 'Une erreur s\'est produite',
    'error.network': 'Erreur de réseau',
    'error.unauthorized': 'Non autorisé',
    'error.forbidden': 'Accès interdit',
    'error.not_found': 'Page non trouvée',
    'error.server_error': 'Erreur du serveur',
    'error.validation': 'Erreur de validation',
    'error.required_field': 'Ce champ est requis',
    'error.invalid_email': 'Email invalide',
    'error.invalid_phone': 'Numéro de téléphone invalide',
    'error.password_mismatch': 'Les mots de passe ne correspondent pas',
    'error.invalid_credentials': 'Identifiants invalides',

    // Success
    'success.saved': 'Enregistré avec succès',
    'success.deleted': 'Supprimé avec succès',
    'success.updated': 'Mis à jour avec succès',
    'success.created': 'Créé avec succès',
    'success.booking_confirmed': 'Réservation confirmée',
    'success.order_placed': 'Commande passée',
    'success.payment_received': 'Paiement reçu',

    // Content
    'content.not_available': 'Contenu Non Disponible',
    'content.load_error': 'Impossible de charger le contenu. Veuillez réessayer plus tard.',
    'content.no_data': 'Aucune donnée disponible',
    'content.loading': 'Chargement...',

    // Database Reset
    'reset.title': 'Réinitialisation de Base de Données',
    'reset.description': 'Effacer toutes les données opérationnelles tout en préservant la configuration système',
    'reset.warning': '⚠️ Opération Critique',
    'reset.warning_text': 'Cela supprimera définitivement toutes les données opérationnelles incluant :',
    'reset.will_delete': '• Toutes les réservations de chambres',
    'reset.will_delete_orders': '• Toutes les commandes de restaurant',
    'reset.will_delete_conference': '• Toutes les réservations de salles de conférence',
    'reset.will_delete_services': '• Toutes les demandes de service',
    'reset.will_delete_feedback': '• Tous les commentaires clients',
    'reset.will_delete_notifications': '• Toutes les notifications',
    'reset.preserved': 'Préservé :',
    'reset.preserved_text': 'Configurations de chambres, articles de menu, équipements, données de salles de conférence et paramètres système.',
    'reset.confirm_title': 'Confirmer la Réinitialisation',
    'reset.confirm_text': 'Cette action ne peut pas être annulée. Toutes les données opérationnelles seront définitivement supprimées.',
    'reset.type_delete': 'Tapez "delete" pour confirmer :',
    'reset.button': 'Réinitialiser Base de Données',
    'reset.loading': 'Réinitialisation...',
    'reset.success': 'Réinitialisation Terminée',
    'reset.success_text': 'Toutes les données opérationnelles ont été effacées. Les données de configuration système ont été préservées.',
    'reset.failed': 'Échec de la Réinitialisation',
    'reset.failed_text': 'Une erreur s\'est produite lors de la réinitialisation de la base de données. Veuillez réessayer.',
    'reset.invalid_confirmation': 'Confirmation Invalide',
    'reset.invalid_text': 'Veuillez taper "delete" exactement pour confirmer la réinitialisation',

    // System
    'system.overview': 'Aperçu du Système',
    'system.status': 'Statut de Base de Données',
    'system.operational': 'Opérationnel',
    'system.last_reset': 'Dernière Réinitialisation',
    'system.never': 'Jamais',
    'system.version': 'Version du Système',
    'system.important_notes': 'Notes Importantes',
    'system.reset_usage': '• Utilisez la fonction de réinitialisation uniquement au début des opérations',
    'system.data_cleared': '• Toutes les données opérationnelles seront effacées mais la configuration système préservée',
    'system.irreversible': '• Cette action est irréversible et nécessite une confirmation',
    'system.backup': '• Considérez sauvegarder les données avant la réinitialisation si nécessaire'
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.rooms': 'Rooms',
    'nav.conference': 'Conference Room',
    'nav.about': 'About',
    'nav.restaurant': 'Restaurant',
    'nav.contact': 'Contact',
    'nav.dashboard': 'Dashboard',
    'nav.bookings': 'Bookings',
    'nav.users': 'Users',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',

    // Common Actions
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.delete': 'Delete',
    'action.edit': 'Edit',
    'action.add': 'Add',
    'action.view': 'View',
    'action.close': 'Close',
    'action.confirm': 'Confirm',
    'action.back': 'Back',
    'action.next': 'Next',
    'action.previous': 'Previous',
    'action.submit': 'Submit',
    'action.search': 'Search',
    'action.filter': 'Filter',
    'action.sort': 'Sort',
    'action.refresh': 'Refresh',
    'action.print': 'Print',
    'action.download': 'Download',
    'action.upload': 'Upload',

    // Status
    'status.pending': 'Pending',
    'status.approved': 'Approved',
    'status.rejected': 'Rejected',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.available': 'Available',
    'status.occupied': 'Occupied',
    'status.maintenance': 'Maintenance',
    'status.cleaning': 'Cleaning',

    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.overview': 'Overview',
    'dashboard.stats': 'Statistics',
    'dashboard.recent_activity': 'Recent Activity',
    'dashboard.quick_actions': 'Quick Actions',
    'dashboard.total_users': 'Total Users',
    'dashboard.total_rooms': 'Total Rooms',
    'dashboard.total_bookings': 'Total Bookings',
    'dashboard.total_revenue': 'Total Revenue',
    'dashboard.pending_orders': 'Pending Orders',
    'dashboard.available_tables': 'Available Tables',
    'dashboard.active_menu_items': 'Active Menu Items',

    // Booking
    'booking.new': 'New Booking',
    'booking.edit': 'Edit Booking',
    'booking.details': 'Booking Details',
    'booking.confirm': 'Confirm Booking',
    'booking.cancel': 'Cancel Booking',
    'booking.check_in': 'Check In',
    'booking.check_out': 'Check Out',
    'booking.guest_name': 'Guest Name',
    'booking.guest_email': 'Guest Email',
    'booking.guest_phone': 'Guest Phone',
    'booking.room_type': 'Room Type',
    'booking.room_number': 'Room Number',
    'booking.nights': 'Nights',
    'booking.total_amount': 'Total Amount',
    'booking.payment_method': 'Payment Method',
    'booking.transaction_ref': 'Transaction Reference',
    'booking.booking_id': 'Booking ID',
    'booking.booking_date': 'Booking Date',
    'booking.booking_status': 'Booking Status',

    // Room
    'room.available': 'Available',
    'room.occupied': 'Occupied',
    'room.maintenance': 'Maintenance',
    'room.cleaning': 'Cleaning',
    'room.standard': 'Standard',
    'room.deluxe': 'Deluxe',
    'room.suite': 'Suite',
    'room.presidential': 'Presidential',
    'room.price_per_night': 'Price per Night',
    'room.amenities': 'Amenities',
    'room.description': 'Description',
    'room.capacity': 'Capacity',
    'room.size': 'Size',
    'room.view': 'View',

    // Restaurant
    'restaurant.menu': 'Menu',
    'restaurant.order': 'Order',
    'restaurant.orders': 'Orders',
    'restaurant.new_order': 'New Order',
    'restaurant.order_details': 'Order Details',
    'restaurant.order_status': 'Order Status',
    'restaurant.order_total': 'Order Total',
    'restaurant.table_number': 'Table Number',
    'restaurant.item_name': 'Item Name',
    'restaurant.item_price': 'Item Price',
    'restaurant.item_quantity': 'Quantity',
    'restaurant.item_total': 'Item Total',
    'restaurant.subtotal': 'Subtotal',
    'restaurant.tax': 'Tax',
    'restaurant.discount': 'Discount',
    'restaurant.grand_total': 'Grand Total',
    'restaurant.payment_method': 'Payment Method',
    'restaurant.cash': 'Cash',
    'restaurant.card': 'Card',
    'restaurant.mobile_money': 'Mobile Money',

    // Conference Room
    'conference.room': 'Conference Room',
    'conference.rooms': 'Conference Rooms',
    'conference.booking': 'Conference Booking',
    'conference.bookings': 'Conference Bookings',
    'conference.room_name': 'Room Name',
    'conference.capacity': 'Capacity',
    'conference.price_per_day': 'Price per Day',
    'conference.booking_date': 'Booking Date',
    'conference.start_time': 'Start Time',
    'conference.end_time': 'End Time',
    'conference.attendees': 'Attendees',
    'conference.notes': 'Notes',

    // Receipt
    'receipt.title': 'BOOKING RECEIPT',
    'receipt.company_name': 'KABINDA LODGE',
    'receipt.booking_receipt': 'BOOKING RECEIPT',
    'receipt.receipt_date': 'Receipt Date',
    'receipt.booking_id': 'Booking ID',
    'receipt.guest_name': 'Guest Name',
    'receipt.guest_email': 'Guest Email',
    'receipt.guest_phone': 'Guest Phone',
    'receipt.room_name': 'Room Name',
    'receipt.room_type': 'Room Type',
    'receipt.check_in': 'Check In',
    'receipt.check_out': 'Check Out',
    'receipt.nights': 'Nights',
    'receipt.room_price': 'Room Price',
    'receipt.total_amount': 'Total Amount',
    'receipt.payment_method': 'Payment Method',
    'receipt.transaction_ref': 'Transaction Reference',
    'receipt.promotion': 'Promotion',
    'receipt.discount': 'Discount',
    'receipt.subtotal': 'Subtotal',
    'receipt.tax': 'Tax',
    'receipt.grand_total': 'Grand Total',
    'receipt.thank_you': 'Thank you for choosing Kabinda Lodge. We hope you enjoy your stay!',
    'receipt.contact_info': 'For any inquiries, please contact our reception desk.',
    'receipt.company_tagline': 'Kabinda Lodge - Luxury Hospitality Experience',

    // Restaurant Receipt
    'restaurant_receipt.title': 'RESTAURANT RECEIPT',
    'restaurant_receipt.order_receipt': 'ORDER RECEIPT',
    'restaurant_receipt.order_id': 'Order ID',
    'restaurant_receipt.order_date': 'Order Date',
    'restaurant_receipt.table_number': 'Table Number',
    'restaurant_receipt.items': 'Items',
    'restaurant_receipt.quantity': 'Quantity',
    'restaurant_receipt.price': 'Price',
    'restaurant_receipt.total': 'Total',
    'restaurant_receipt.thank_you': 'Thank you for your order!',

    // User Management
    'user.profile': 'Profile',
    'user.settings': 'Settings',
    'user.logout': 'Logout',
    'user.login': 'Login',
    'user.register': 'Register',
    'user.email': 'Email',
    'user.password': 'Password',
    'user.confirm_password': 'Confirm Password',
    'user.first_name': 'First Name',
    'user.last_name': 'Last Name',
    'user.phone': 'Phone',
    'user.role': 'Role',
    'user.admin': 'Admin',
    'user.receptionist': 'Receptionist',
    'user.restaurant_lead': 'Restaurant Lead',
    'user.kitchen': 'Kitchen',
    'user.super_admin': 'Super Admin',

    // Messages
    'message.success': 'Success',
    'message.error': 'Error',
    'message.warning': 'Warning',
    'message.info': 'Information',
    'message.confirm': 'Confirm',
    'message.cancel': 'Cancel',
    'message.yes': 'Yes',
    'message.no': 'No',
    'message.ok': 'OK',
    'message.loading': 'Loading...',
    'message.saving': 'Saving...',
    'message.deleting': 'Deleting...',
    'message.please_wait': 'Please wait...',

    // Form Labels
    'form.required': 'Required',
    'form.optional': 'Optional',
    'form.email': 'Email Address',
    'form.password': 'Password',
    'form.confirm_password': 'Confirm Password',
    'form.first_name': 'First Name',
    'form.last_name': 'Last Name',
    'form.phone': 'Phone',
    'form.address': 'Address',
    'form.city': 'City',
    'form.country': 'Country',
    'form.postal_code': 'Postal Code',
    'form.notes': 'Notes',
    'form.description': 'Description',
    'form.title': 'Title',
    'form.category': 'Category',
    'form.price': 'Price',
    'form.quantity': 'Quantity',
    'form.date': 'Date',
    'form.time': 'Time',
    'form.start_date': 'Start Date',
    'form.end_date': 'End Date',

    // Time
    'time.today': 'Today',
    'time.yesterday': 'Yesterday',
    'time.tomorrow': 'Tomorrow',
    'time.this_week': 'This Week',
    'time.last_week': 'Last Week',
    'time.this_month': 'This Month',
    'time.last_month': 'Last Month',
    'time.this_year': 'This Year',
    'time.last_year': 'Last Year',

    // Months
    'month.january': 'January',
    'month.february': 'February',
    'month.march': 'March',
    'month.april': 'April',
    'month.may': 'May',
    'month.june': 'June',
    'month.july': 'July',
    'month.august': 'August',
    'month.september': 'September',
    'month.october': 'October',
    'month.november': 'November',
    'month.december': 'December',

    // Days
    'day.monday': 'Monday',
    'day.tuesday': 'Tuesday',
    'day.wednesday': 'Wednesday',
    'day.thursday': 'Thursday',
    'day.friday': 'Friday',
    'day.saturday': 'Saturday',
    'day.sunday': 'Sunday',

    // Errors
    'error.general': 'An error occurred',
    'error.network': 'Network error',
    'error.unauthorized': 'Unauthorized',
    'error.forbidden': 'Access forbidden',
    'error.not_found': 'Page not found',
    'error.server_error': 'Server error',
    'error.validation': 'Validation error',
    'error.required_field': 'This field is required',
    'error.invalid_email': 'Invalid email',
    'error.invalid_phone': 'Invalid phone number',
    'error.password_mismatch': 'Passwords do not match',
    'error.invalid_credentials': 'Invalid credentials',

    // Success
    'success.saved': 'Saved successfully',
    'success.deleted': 'Deleted successfully',
    'success.updated': 'Updated successfully',
    'success.created': 'Created successfully',
    'success.booking_confirmed': 'Booking confirmed',
    'success.order_placed': 'Order placed',
    'success.payment_received': 'Payment received',

    // Content
    'content.not_available': 'Content Not Available',
    'content.load_error': 'Unable to load content. Please try again later.',
    'content.no_data': 'No data available',
    'content.loading': 'Loading...',

    // Database Reset
    'reset.title': 'Database Reset',
    'reset.description': 'Clear all operational data while preserving system configuration',
    'reset.warning': '⚠️ Critical Operation',
    'reset.warning_text': 'This will permanently delete all operational data including:',
    'reset.will_delete': '• All room bookings and reservations',
    'reset.will_delete_orders': '• All restaurant orders and payments',
    'reset.will_delete_conference': '• All conference room bookings',
    'reset.will_delete_services': '• All service requests and maintenance records',
    'reset.will_delete_feedback': '• All guest feedback and reviews',
    'reset.will_delete_notifications': '• All notifications and system logs',
    'reset.preserved': 'Preserved:',
    'reset.preserved_text': 'Room configurations, menu items, amenities, conference room data, and system settings.',
    'reset.confirm_title': 'Confirm Database Reset',
    'reset.confirm_text': 'This action cannot be undone. All operational data will be permanently deleted.',
    'reset.type_delete': 'Type "delete" to confirm:',
    'reset.button': 'Reset Database',
    'reset.loading': 'Resetting...',
    'reset.success': 'Database Reset Complete',
    'reset.success_text': 'All operational data has been cleared. System configuration data has been preserved.',
    'reset.failed': 'Reset Failed',
    'reset.failed_text': 'An error occurred while resetting the database. Please try again.',
    'reset.invalid_confirmation': 'Invalid Confirmation',
    'reset.invalid_text': 'Please type "delete" exactly to confirm the reset',

    // System
    'system.overview': 'System Overview',
    'system.status': 'Database Status',
    'system.operational': 'Operational',
    'system.last_reset': 'Last Reset',
    'system.never': 'Never',
    'system.version': 'System Version',
    'system.important_notes': 'Important Notes',
    'system.reset_usage': '• Use the database reset feature only when starting operations',
    'system.data_cleared': '• All operational data will be cleared but system configuration preserved',
    'system.irreversible': '• This action is irreversible and requires confirmation',
    'system.backup': '• Consider backing up data before reset if needed'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('fr');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLanguageReady, setIsLanguageReady] = useState(false);
  const [canChangeLanguage, setCanChangeLanguage] = useState(false);
  const [supportedLanguages] = useState<LanguageCode[]>(['fr', 'en']);

  // Check user role for language change permission
  useEffect(() => {
    if (user) {
      const checkUserRole = async () => {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          
          setCanChangeLanguage(userData?.role === 'SuperAdmin');
        } catch (error) {
          console.error('Error checking user role:', error);
          setCanChangeLanguage(false);
        }
      };
      checkUserRole();
    } else {
      setCanChangeLanguage(false);
    }
  }, [user]);

  // Initialize language from system setting
  useEffect(() => {
    const loadSystemLanguage = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'system_default_language')
          .is('user_id', null)
          .maybeSingle();
        
        let systemLanguage: LanguageCode = 'fr';
        if (data?.value && typeof data.value === 'string') {
          try {
            // Try to parse as JSON first (in case it's stored as JSON string)
            const parsed = JSON.parse(data.value);
            systemLanguage = (parsed === 'fr' || parsed === 'en') ? parsed : 'fr';
          } catch {
            // If parsing fails, use the value directly (it's already a plain string)
            systemLanguage = (data.value === 'fr' || data.value === 'en') ? data.value : 'fr';
          }
        }
        setCurrentLanguage(systemLanguage);
      } catch (error) {
        console.error('Error loading system language:', error);
        setCurrentLanguage('fr'); // Default fallback
      }
    };
    
    loadSystemLanguage();
  }, []);

  // Set up real-time subscription for system language changes
  useEffect(() => {
    const subscription = supabase
      .channel('system-language-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings',
          filter: 'key=eq.system_default_language'
        },
        (payload) => {
          if (payload.new && payload.new.value && typeof payload.new.value === 'string') {
            try {
              // Try to parse as JSON first (in case it's stored as JSON string)
              const parsed = JSON.parse(payload.new.value);
              const newLanguage = (parsed === 'fr' || parsed === 'en') ? parsed : 'fr';
              setCurrentLanguage(newLanguage);
            } catch {
              // If parsing fails, use the value directly (it's already a plain string)
              const newLanguage = (payload.new.value === 'fr' || payload.new.value === 'en') ? payload.new.value : 'fr';
              setCurrentLanguage(newLanguage);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    // Load translations for current language
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        // First, load from database
        const { data, error } = await supabase
          .from('translations')
          .select('key, value')
          .eq('language', currentLanguage);

        if (error) {
          console.warn('Failed to load translations from database:', error);
        }

        // Start with default translations
        const translationMap = { ...defaultTranslations[currentLanguage] };

        // Override with database translations if available
        if (data && data.length > 0) {
          data.forEach(item => {
            translationMap[item.key] = item.value;
          });
        }

        // Fallback to English if French translations are missing
        if (currentLanguage === 'fr') {
          const missingKeys = Object.keys(defaultTranslations.en).filter(
            key => !translationMap[key]
          );
          
          missingKeys.forEach(key => {
            translationMap[key] = defaultTranslations.en[key];
          });
        }

        setTranslations(translationMap);
        setIsLanguageReady(true);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to default translations
        setTranslations(defaultTranslations[currentLanguage]);
        setIsLanguageReady(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [currentLanguage]);

  // Set system language function (SuperAdmin only)
  const setSystemLanguage = async (language: LanguageCode) => {
    if (!canChangeLanguage) {
      console.error('Access denied: Only SuperAdmin can change system language');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: JSON.stringify(language) })
        .eq('key', 'system_default_language')
        .is('user_id', null);
      
      if (error) throw error;
      
      // Language will be updated via real-time subscription
    } catch (error) {
      console.error('Error updating system language:', error);
    }
  };

  const t = (key: string, fallback?: string): string => {
    // Return translation if available
    if (translations[key]) {
      return translations[key];
    }
    
    // Return fallback if provided
    if (fallback) {
      return fallback;
    }
    
    // Return key if no translation found
    return key;
  };

  const value: LanguageContextType = {
    currentLanguage,
    setSystemLanguage,
    translations,
    t,
    isLoading,
    supportedLanguages,
    isLanguageReady,
    canChangeLanguage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};