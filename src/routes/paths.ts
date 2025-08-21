export const RoutePaths = {
  Reception: {
    Dashboard: '/kabinda-lodge/reception',
    Guests: '/kabinda-lodge/reception/guests',
    Rooms: '/kabinda-lodge/reception/rooms',
    Services: '/kabinda-lodge/reception/services',
    Maintenance: '/kabinda-lodge/reception/maintenance',
    LostFound: '/kabinda-lodge/reception/lost-found',
    Orders: '/kabinda-lodge/reception/orders',
    Reviews: '/kabinda-lodge/reception/reviews',
    PaymentVerification: '/kabinda-lodge/reception/payment-verification',
    Payments: '/kabinda-lodge/reception/payments',
  },
  Admin: {
    Dashboard: '/kabinda-lodge/admin',
    Rooms: '/kabinda-lodge/admin/rooms',
    Bookings: '/kabinda-lodge/admin/bookings',
    ConferenceRooms: '/kabinda-lodge/admin/conference-rooms',
    Menu: '/kabinda-lodge/admin/menu',
    Content: '/kabinda-lodge/admin/content',
    Promotions: '/kabinda-lodge/admin/promotions',
    Payments: '/kabinda-lodge/admin/payments',
    Users: '/kabinda-lodge/admin/users',
    Reports: '/kabinda-lodge/admin/reports',
    EmailSettings: '/kabinda-lodge/admin/email-settings',
    PaymentManagement: '/kabinda-lodge/admin/payment-management',
    RestaurantTables: '/kabinda-lodge/admin/restaurant-tables',
  },
  Restaurant: {
    Dashboard: '/kabinda-lodge/restaurant-dashboard',
    Orders: '/kabinda-lodge/restaurant/orders',
    Tables: '/kabinda-lodge/restaurant/tables',
    OrderCreation: '/kabinda-lodge/restaurant/order',
    Kitchen: '/kabinda-lodge/restaurant/kitchen',
    Menu: '/kabinda-lodge/restaurant/menu',
    Promotions: '/kabinda-lodge/restaurant/promotions',
  },
  Guest: {
    MyBookings: '/kabinda-lodge/my-bookings',
  }
} as const;

export type RoutePathsType = typeof RoutePaths;
