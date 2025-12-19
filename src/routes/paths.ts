export const RoutePaths = {
  Reception: {
    Dashboard: '/reception',
    Guests: '/reception/guests',
    Rooms: '/reception/rooms',
    Services: '/reception/services',
    Maintenance: '/reception/maintenance',
    LostFound: '/reception/lost-found',
    Orders: '/reception/orders',
    Reviews: '/reception/reviews',
    PaymentVerification: '/reception/payment-verification',
    Payments: '/reception/payments',
    KeyCards: '/reception/key-cards',
  },
  Admin: {
    Dashboard: '/admin',
    Rooms: '/admin/rooms',
    Bookings: '/admin/bookings',
    ConferenceRooms: '/admin/conference-rooms',
    Menu: '/admin/menu',
    Content: '/admin/content',
    Promotions: '/admin/promotions',
    Payments: '/admin/payments',
    Users: '/admin/users',
    Reports: '/admin/reports',
    EmailSettings: '/admin/email-settings',
    PaymentManagement: '/admin/payment-management',
    RestaurantTables: '/admin/restaurant-tables',
    Amenities: '/admin/amenities',
    Maintenance: '/admin/maintenance',
    AgentManagement: '/admin/agents',
    CardIssues: '/admin/card-issues',
  },
  Restaurant: {
    Dashboard: '/restaurant-dashboard',
    Orders: '/restaurant/orders',
    Tables: '/restaurant/tables',
    OrderCreation: '/restaurant/order',
    Kitchen: '/restaurant/kitchen',
    Menu: '/restaurant/menu',
    Promotions: '/restaurant/promotions',
  },
  Guest: {
    MyBookings: '/my-bookings',
  }
} as const;

export type RoutePathsType = typeof RoutePaths;
