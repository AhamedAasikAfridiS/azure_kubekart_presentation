require('dotenv').config();
const connectDB = require('../config/db');
const Product = require('../models/product.model');

const CATEGORY_PREFIX = {
  Electronics: 'ELEC',
  Clothing: 'CLTH',
  Books: 'BOOK',
  'Home & Garden': 'HOME',
  Sports: 'SPRT',
  Toys: 'TOYS',
  Beauty: 'BEAU',
  Other: 'OTHR',
};

const CATEGORY_IMAGE_MAP = {
  Electronics: '/images/products/electronics.svg',
  Clothing: '/images/products/clothing.svg',
  Books: '/images/products/books.svg',
  'Home & Garden': '/images/products/home-garden.svg',
  Sports: '/images/products/sports.svg',
  Toys: '/images/products/toys.svg',
  Beauty: '/images/products/beauty.svg',
  Other: '/images/products/other.svg',
};

const CATEGORY_PRODUCTS = {
  Electronics: [
    { name: 'Wireless Noise-Canceling Headphones', brand: 'SoundMax', price: 3499, stock: 42, tags: ['audio', 'wireless', 'headphones'], imageQuery: 'wireless headphones' },
    { name: 'Smart Fitness Watch', brand: 'PulseTech', price: 5299, stock: 30, tags: ['wearable', 'fitness'], imageQuery: 'smart watch' },
    { name: 'Bluetooth Portable Speaker', brand: 'BassLine', price: 1999, stock: 56, tags: ['speaker', 'bluetooth'], imageQuery: 'portable speaker' },
    { name: 'USB-C Fast Charger 65W', brand: 'Voltix', price: 1299, stock: 85, tags: ['charger', 'usb-c'], imageQuery: 'usb c charger' },
    { name: '4K Streaming Stick', brand: 'ViewCast', price: 2499, stock: 38, tags: ['tv', 'streaming'], imageQuery: 'streaming device' },
    { name: 'Mechanical Gaming Keyboard', brand: 'KeyForge', price: 2899, stock: 27, tags: ['keyboard', 'gaming'], imageQuery: 'gaming keyboard' },
    { name: 'Ergonomic Wireless Mouse', brand: 'ClickPro', price: 1499, stock: 44, tags: ['mouse', 'office'], imageQuery: 'wireless mouse' },
    { name: '1080p Web Camera', brand: 'ClearCam', price: 2199, stock: 33, tags: ['camera', 'video'], imageQuery: 'webcam' },
    { name: '1TB External SSD', brand: 'DataVault', price: 6999, stock: 22, tags: ['storage', 'ssd'], imageQuery: 'external ssd' },
    { name: 'True Wireless Earbuds', brand: 'AeroBeats', price: 2799, stock: 61, tags: ['earbuds', 'audio'], imageQuery: 'wireless earbuds' },
  ],
  Clothing: [
    { name: 'Classic Cotton Crew T-Shirt', brand: 'UrbanWeave', price: 499, stock: 120, tags: ['tshirt', 'casual'], imageQuery: 'cotton tshirt' },
    { name: 'Slim Fit Denim Jeans', brand: 'DenimCraft', price: 1499, stock: 90, tags: ['jeans', 'denim'], imageQuery: 'blue jeans' },
    { name: 'Hooded Sweatshirt', brand: 'CozyNest', price: 1799, stock: 74, tags: ['hoodie', 'winter'], imageQuery: 'hoodie' },
    { name: 'Formal White Shirt', brand: 'OfficeEdge', price: 1299, stock: 66, tags: ['formal', 'shirt'], imageQuery: 'formal shirt' },
    { name: 'Athletic Track Pants', brand: 'MoveFit', price: 999, stock: 81, tags: ['sportswear', 'pants'], imageQuery: 'track pants' },
    { name: 'Floral Summer Dress', brand: 'Bloomline', price: 1699, stock: 58, tags: ['dress', 'summer'], imageQuery: 'summer dress' },
    { name: 'Lightweight Windbreaker', brand: 'TrailWave', price: 1999, stock: 49, tags: ['jacket', 'windbreaker'], imageQuery: 'windbreaker jacket' },
    { name: 'Wool Blend Sweater', brand: 'WarmThread', price: 1899, stock: 54, tags: ['sweater', 'winter'], imageQuery: 'wool sweater' },
    { name: 'Linen Casual Shorts', brand: 'BreezeWear', price: 899, stock: 95, tags: ['shorts', 'linen'], imageQuery: 'casual shorts' },
    { name: 'Leather Belt', brand: 'PrimeAccessories', price: 699, stock: 130, tags: ['belt', 'accessories'], imageQuery: 'leather belt' },
  ],
  Books: [
    { name: 'Mastering JavaScript', brand: 'CodePress', price: 799, stock: 105, tags: ['javascript', 'programming'], imageQuery: 'programming book' },
    { name: 'React for Professionals', brand: 'DevShelf', price: 899, stock: 84, tags: ['react', 'frontend'], imageQuery: 'react book' },
    { name: 'Data Structures Simplified', brand: 'AlgoWorld', price: 749, stock: 92, tags: ['algorithms', 'coding'], imageQuery: 'data structures book' },
    { name: 'Node.js in Practice', brand: 'BackendLab', price: 829, stock: 76, tags: ['nodejs', 'backend'], imageQuery: 'node js book' },
    { name: 'Clean Code Fundamentals', brand: 'CraftReads', price: 999, stock: 68, tags: ['software', 'best practices'], imageQuery: 'software engineering book' },
    { name: 'Deep Work Habits', brand: 'FocusHouse', price: 599, stock: 110, tags: ['productivity', 'self-help'], imageQuery: 'self help book' },
    { name: 'Financial Freedom Basics', brand: 'MoneyMind', price: 649, stock: 89, tags: ['finance', 'money'], imageQuery: 'finance book' },
    { name: 'Modern UI Design', brand: 'PixelPress', price: 699, stock: 73, tags: ['design', 'uiux'], imageQuery: 'design book' },
    { name: 'Digital Marketing Playbook', brand: 'GrowthReads', price: 729, stock: 78, tags: ['marketing', 'business'], imageQuery: 'marketing book' },
    { name: 'The Startup Blueprint', brand: 'FounderStack', price: 679, stock: 82, tags: ['startup', 'entrepreneurship'], imageQuery: 'startup book' },
  ],
  'Home & Garden': [
    { name: 'Indoor Air Purifier', brand: 'PureNest', price: 8499, stock: 28, tags: ['air purifier', 'home'], imageQuery: 'air purifier' },
    { name: 'Ceramic Plant Pot Set', brand: 'GreenAura', price: 1399, stock: 65, tags: ['garden', 'pots'], imageQuery: 'plant pots' },
    { name: 'Memory Foam Pillow Pair', brand: 'SleepCraft', price: 2199, stock: 51, tags: ['bedroom', 'comfort'], imageQuery: 'memory foam pillow' },
    { name: 'Bamboo Laundry Basket', brand: 'TidyHome', price: 1199, stock: 70, tags: ['laundry', 'storage'], imageQuery: 'laundry basket' },
    { name: 'LED String Lights', brand: 'Glowify', price: 799, stock: 96, tags: ['decor', 'lights'], imageQuery: 'string lights' },
    { name: 'Non-Stick Cookware Set', brand: 'KitchenMate', price: 4599, stock: 34, tags: ['kitchen', 'cookware'], imageQuery: 'cookware set' },
    { name: 'Foldable Study Desk', brand: 'SpaceSaver', price: 3899, stock: 29, tags: ['furniture', 'desk'], imageQuery: 'study desk' },
    { name: 'Garden Watering Can', brand: 'LeafDrop', price: 499, stock: 88, tags: ['watering', 'garden'], imageQuery: 'watering can' },
    { name: 'Microfiber Cleaning Kit', brand: 'SparklePro', price: 649, stock: 112, tags: ['cleaning', 'home care'], imageQuery: 'cleaning supplies' },
    { name: 'Wall Mounted Bookshelf', brand: 'OakLine', price: 2499, stock: 39, tags: ['shelf', 'decor'], imageQuery: 'wall bookshelf' },
  ],
  Sports: [
    { name: 'Professional Yoga Mat', brand: 'ZenFlex', price: 999, stock: 86, tags: ['yoga', 'fitness'], imageQuery: 'yoga mat' },
    { name: 'Adjustable Dumbbell Set', brand: 'IronPeak', price: 5499, stock: 24, tags: ['gym', 'weights'], imageQuery: 'dumbbells' },
    { name: 'Football Training Ball', brand: 'KickPro', price: 1199, stock: 57, tags: ['football', 'training'], imageQuery: 'football ball' },
    { name: 'Badminton Racket Combo', brand: 'CourtAce', price: 1899, stock: 47, tags: ['badminton', 'rackets'], imageQuery: 'badminton racket' },
    { name: 'Cycling Helmet', brand: 'RideSafe', price: 1599, stock: 53, tags: ['cycling', 'safety'], imageQuery: 'cycling helmet' },
    { name: 'Resistance Band Kit', brand: 'FitLoop', price: 899, stock: 79, tags: ['workout', 'bands'], imageQuery: 'resistance bands' },
    { name: 'Skipping Rope Pro', brand: 'JumpX', price: 449, stock: 133, tags: ['cardio', 'rope'], imageQuery: 'jump rope' },
    { name: 'Sports Water Bottle 1L', brand: 'HydraFlow', price: 599, stock: 118, tags: ['hydration', 'bottle'], imageQuery: 'sports bottle' },
    { name: 'Cricket Bat English Willow', brand: 'Boundary', price: 3999, stock: 31, tags: ['cricket', 'bat'], imageQuery: 'cricket bat' },
    { name: 'Running Shoes Elite', brand: 'FleetFoot', price: 2999, stock: 45, tags: ['running', 'shoes'], imageQuery: 'running shoes' },
  ],
  Toys: [
    { name: 'Remote Control Racing Car', brand: 'TurboToys', price: 1799, stock: 64, tags: ['rc car', 'kids'], imageQuery: 'remote control car' },
    { name: 'Building Blocks 500 Pieces', brand: 'BrickJoy', price: 1499, stock: 72, tags: ['blocks', 'creative'], imageQuery: 'building blocks' },
    { name: 'Plush Teddy Bear Large', brand: 'CuddleMate', price: 999, stock: 83, tags: ['soft toy', 'teddy'], imageQuery: 'teddy bear' },
    { name: 'Puzzle Set for Kids', brand: 'MindMosaic', price: 699, stock: 98, tags: ['puzzle', 'brain game'], imageQuery: 'kids puzzle' },
    { name: 'Mini Drone for Beginners', brand: 'SkyFun', price: 2599, stock: 27, tags: ['drone', 'tech toy'], imageQuery: 'toy drone' },
    { name: 'Magnetic Drawing Board', brand: 'DoodleBox', price: 549, stock: 109, tags: ['drawing', 'learning'], imageQuery: 'drawing board toy' },
    { name: 'Action Figure Hero Series', brand: 'PowerKids', price: 899, stock: 91, tags: ['action figure', 'collectible'], imageQuery: 'action figure toy' },
    { name: 'Wooden Train Set', brand: 'TinyTracks', price: 1299, stock: 52, tags: ['train', 'wooden toys'], imageQuery: 'wooden train toy' },
    { name: 'Bubble Maker Machine', brand: 'SplashPop', price: 799, stock: 76, tags: ['bubbles', 'outdoor'], imageQuery: 'bubble machine' },
    { name: 'Kids Art & Craft Kit', brand: 'ColorNest', price: 1199, stock: 68, tags: ['craft', 'art'], imageQuery: 'kids craft kit' },
  ],
  Beauty: [
    { name: 'Vitamin C Face Serum', brand: 'GlowLeaf', price: 899, stock: 95, tags: ['skincare', 'serum'], imageQuery: 'face serum' },
    { name: 'Hydrating Face Moisturizer', brand: 'PureSkin', price: 749, stock: 103, tags: ['moisturizer', 'skincare'], imageQuery: 'face moisturizer' },
    { name: 'Matte Lipstick Collection', brand: 'ColorMuse', price: 1299, stock: 61, tags: ['lipstick', 'makeup'], imageQuery: 'lipstick set' },
    { name: 'Herbal Shampoo 500ml', brand: 'NatureWash', price: 649, stock: 87, tags: ['haircare', 'shampoo'], imageQuery: 'shampoo bottle' },
    { name: 'Nourishing Hair Conditioner', brand: 'SilkRoot', price: 599, stock: 89, tags: ['conditioner', 'hair'], imageQuery: 'hair conditioner' },
    { name: 'Sunscreen SPF 50', brand: 'SunShield', price: 699, stock: 114, tags: ['sunscreen', 'spf'], imageQuery: 'sunscreen' },
    { name: 'Facial Cleansing Brush', brand: 'DermaWave', price: 1499, stock: 44, tags: ['cleansing', 'beauty tool'], imageQuery: 'facial cleansing brush' },
    { name: 'Perfume Mist Floral', brand: 'BlushAura', price: 1799, stock: 50, tags: ['fragrance', 'perfume'], imageQuery: 'perfume bottle' },
    { name: 'Nail Paint Combo Pack', brand: 'NailNest', price: 999, stock: 73, tags: ['nail polish', 'makeup'], imageQuery: 'nail polish set' },
    { name: 'Makeup Brush Set', brand: 'BlendPro', price: 1099, stock: 66, tags: ['brush', 'beauty'], imageQuery: 'makeup brushes' },
  ],
  Other: [
    { name: 'Laptop Backpack 25L', brand: 'CarryMate', price: 1899, stock: 58, tags: ['backpack', 'travel'], imageQuery: 'laptop backpack' },
    { name: 'Stainless Steel Water Flask', brand: 'ThermoCore', price: 899, stock: 101, tags: ['flask', 'bottle'], imageQuery: 'steel flask' },
    { name: 'Portable Travel Organizer', brand: 'PackRight', price: 699, stock: 93, tags: ['organizer', 'travel'], imageQuery: 'travel organizer' },
    { name: 'Car Phone Mount', brand: 'DriveGrip', price: 549, stock: 117, tags: ['car accessory', 'mount'], imageQuery: 'car phone holder' },
    { name: 'Universal Travel Adapter', brand: 'GlobePlug', price: 1299, stock: 62, tags: ['adapter', 'travel'], imageQuery: 'travel adapter' },
    { name: 'Desk Organizer Tray', brand: 'NeatDesk', price: 599, stock: 126, tags: ['office', 'organizer'], imageQuery: 'desk organizer' },
    { name: 'Insulated Lunch Box', brand: 'FreshPack', price: 799, stock: 88, tags: ['lunch box', 'kitchen'], imageQuery: 'lunch box' },
    { name: 'Reusable Shopping Bags Set', brand: 'EcoCarry', price: 499, stock: 140, tags: ['eco', 'bags'], imageQuery: 'shopping bags' },
    { name: 'Portable Power Bank 20000mAh', brand: 'ChargeNest', price: 2199, stock: 46, tags: ['power bank', 'mobile'], imageQuery: 'power bank' },
    { name: 'Travel Neck Pillow', brand: 'CloudRest', price: 699, stock: 97, tags: ['travel', 'comfort'], imageQuery: 'travel neck pillow' },
  ],
};

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const buildDescription = (name, category) =>
  `${name} crafted for ${category.toLowerCase()} shoppers. Durable build, reliable quality, and great value for everyday use.`;

const buildImageUrl = (category) => CATEGORY_IMAGE_MAP[category] || CATEGORY_IMAGE_MAP.Other;

const buildProducts = () => {
  const products = [];

  Object.entries(CATEGORY_PRODUCTS).forEach(([category, items]) => {
    items.forEach((item, idx) => {
      const sku = `${CATEGORY_PREFIX[category]}-${String(idx + 1).padStart(3, '0')}`;
      products.push({
        name: item.name,
        description: buildDescription(item.name, category),
        price: item.price,
        category,
        stock: item.stock,
        imageUrl: buildImageUrl(category),
        sku,
        brand: item.brand,
        rating: { average: 3.8 + (idx % 3) * 0.3, count: 20 + idx * 7 },
        isActive: true,
        tags: [...new Set([category.toLowerCase(), slugify(item.name), ...(item.tags || [])])],
      });
    });
  });

  return products;
};

const seedProducts = async () => {
  const products = buildProducts();
  let upsertedCount = 0;
  let modifiedCount = 0;

  await connectDB();

  try {
    const operations = products.map((product) => ({
      updateOne: {
        filter: { sku: product.sku },
        update: { $set: product },
        upsert: true,
      },
    }));

    const result = await Product.bulkWrite(operations, { ordered: false });
    upsertedCount = result.upsertedCount || 0;
    modifiedCount = result.modifiedCount || 0;

    console.log(`Seed complete: ${products.length} products processed.`);
    console.log(`Inserted: ${upsertedCount}, Updated: ${modifiedCount}`);
  } finally {
    await Product.db.close();
  }
};

seedProducts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  });
