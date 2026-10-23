export interface Order {
  id: string;
  customer: string;
  phone: string;
  vendor: string;
  vendorAddr: string;
  deliveryAddr: string;
  area: string;
  distance: string;
  eta: string;
  amount: number;
  cod: boolean;
  status: 'assigned' | 'picked' | 'delivered' | 'cancelled';
  time: string;
  items: string[];
}

export const ORDERS: Order[] = [
  {
    id: '#ORD-1027',
    customer: 'Priya Singh',
    phone: '9876543210',
    vendor: 'Biryani Hub',
    vendorAddr: 'Shop 12, Hazratganj Market',
    deliveryAddr: 'Flat 3B, Anand Nagar, Gomti Nagar',
    area: 'Gomti Nagar',
    distance: '1.4 km',
    eta: '~6 min',
    amount: 280,
    cod: true,
    status: 'assigned',
    time: '2 min ago',
    items: ['Chicken Biryani x1', 'Raita x1', 'Cold Drink x2'],
  },
  {
    id: '#ORD-1025',
    customer: 'Amit Kumar',
    phone: '9123456789',
    vendor: 'Pizza Palace',
    vendorAddr: 'Plot 5, Aliganj Main Road',
    deliveryAddr: 'Plot 7, Vikas Nagar, Aliganj',
    area: 'Aliganj',
    distance: '3.2 km',
    eta: '~14 min',
    amount: 650,
    cod: false,
    status: 'picked',
    time: '15 min ago',
    items: ['Margherita Pizza x1', 'Garlic Bread x2', 'Pasta x1'],
  },
  {
    id: '#ORD-1026',
    customer: 'Neha Verma',
    phone: '9988776655',
    vendor: 'Spice Garden',
    vendorAddr: '7A, Hazratganj Circle',
    deliveryAddr: '12 MG Road, Hazratganj',
    area: 'Hazratganj',
    distance: '2.1 km',
    eta: '~9 min',
    amount: 190,
    cod: true,
    status: 'assigned',
    time: '8 min ago',
    items: ['Paneer Tikka x1', 'Naan x3', 'Dal Makhani x1'],
  },
  {
    id: '#ORD-1024',
    customer: 'Rahul Sharma',
    phone: '9012345678',
    vendor: 'Spice Garden',
    vendorAddr: '7A, Hazratganj Circle',
    deliveryAddr: 'A-5, Sector C, Mahanagar',
    area: 'Hazratganj',
    distance: '2.8 km',
    eta: 'Delivered',
    amount: 420,
    cod: false,
    status: 'delivered',
    time: '42 min ago',
    items: ['Butter Chicken x1', 'Roti x4', 'Rice x1'],
  },
  {
    id: '#ORD-1023',
    customer: 'Rohit Gupta',
    phone: '9807654321',
    vendor: 'Biryani Hub',
    vendorAddr: 'Shop 12, Hazratganj Market',
    deliveryAddr: 'B-12, Viram Khand, Gomti Nagar',
    area: 'Gomti Nagar',
    distance: '4.1 km',
    eta: 'Delivered',
    amount: 280,
    cod: true,
    status: 'delivered',
    time: '1 hr ago',
    items: ['Mutton Biryani x2', 'Salad x1'],
  },
  {
    id: '#ORD-1020',
    customer: 'Suresh M.',
    phone: '9871234560',
    vendor: 'Spice Garden',
    vendorAddr: '7A, Hazratganj Circle',
    deliveryAddr: 'C-3, Indira Nagar',
    area: 'Indira Nagar',
    distance: '5.2 km',
    eta: 'Cancelled',
    amount: 310,
    cod: false,
    status: 'cancelled',
    time: '2 hr ago',
    items: ['Thali x2'],
  },
];

export const DELIVERY_BOY = {
  id: 'DB-042',
  name: 'Rajesh Kumar',
  initials: 'RK',
  phone: '9876500001',
  zone: 'Lucknow Central',
  vehicle: 'Bike · UP32 AB 1234',
  joinedDate: 'Jan 2024',
  rating: 4.8,
  totalDeliveries: 1284,
};

export const WEEKLY_EARNINGS = [
  { day: 'Mon', amount: 520 },
  { day: 'Tue', amount: 680 },
  { day: 'Wed', amount: 410 },
  { day: 'Thu', amount: 750 },
  { day: 'Fri', amount: 600 },
  { day: 'Sat', amount: 590 },
  { day: 'Sun', amount: 680 },
];

export const NOTIFICATIONS = [
  { id: 1, color: '#1A56DB', title: 'New order assigned', body: '#ORD-1028 — Tandoor Express, Indira Nagar', time: 'Just now', unread: true },
  { id: 2, color: '#0E9F6E', title: 'Tip received! ₹200', body: 'Amit Kumar tipped you for order #ORD-1022', time: '18 min ago', unread: true },
  { id: 3, color: '#FF8C00', title: 'Bonus unlocked 🎉', body: 'Complete 15 deliveries today for ₹150 bonus', time: '1 hr ago', unread: false },
  { id: 4, color: '#E02424', title: 'Order cancelled', body: '#ORD-1020 cancelled by customer — no penalty', time: '2 hr ago', unread: false },
  { id: 5, color: '#0E9F6E', title: 'Earnings credited', body: 'Yesterday\'s ₹590 credited to your wallet', time: 'Yesterday', unread: false },
  { id: 6, color: '#1A56DB', title: 'Zone update', body: 'Peak hours 12pm–3pm in Hazratganj — more orders!', time: 'Yesterday', unread: false },
];