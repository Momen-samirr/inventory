import { PrismaClient, UserRole, AuditAction, StockMovementType } from "@prisma/client";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();
const prisma = new PrismaClient();

// Helper function to generate random date within last N days
function generateRandomDate(daysAgo: number): Date {
  const now = new Date();
  const daysBack = Math.floor(Math.random() * daysAgo);
  const hoursBack = Math.floor(Math.random() * 24);
  const minutesBack = Math.floor(Math.random() * 60);
  
  const date = new Date(now);
  date.setDate(date.getDate() - daysBack);
  date.setHours(date.getHours() - hoursBack);
  date.setMinutes(date.getMinutes() - minutesBack);
  
  return date;
}

// Helper function to generate SKU
function generateSKU(categoryPrefix: string, index: number): string {
  const paddedIndex = String(index).padStart(5, "0");
  return `${categoryPrefix}-${paddedIndex}`;
}

// Helper function to hash password
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Clear all existing data in correct order
async function clearAllData() {
  console.log("Clearing existing data...");
  
  await prisma.auditLog.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.sales.deleteMany({});
  await prisma.purchases.deleteMany({});
  await prisma.expenseByCategory.deleteMany({});
  await prisma.expenseSummary.deleteMany({});
  await prisma.purchaseSummary.deleteMany({});
  await prisma.salesSummary.deleteMany({});
  await prisma.expenses.deleteMany({});
  await prisma.products.deleteMany({});
  await prisma.categories.deleteMany({});
  await prisma.users.deleteMany({});
  
  console.log("All data cleared.");
}

// Seed Users
async function seedUsers() {
  console.log("Seeding users...");
  
  const users = [
    {
      name: "Admin User",
      email: "admin@inventory.com",
      password: await hashPassword("Admin@2024"),
      role: UserRole.ADMIN,
      isActive: true,
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      createdAt: generateRandomDate(90),
    },
    {
      name: "Sarah Johnson",
      email: "sarah.johnson@inventory.com",
      password: await hashPassword("Manager@2024"),
      role: UserRole.MANAGER,
      isActive: true,
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      createdAt: generateRandomDate(75),
    },
    {
      name: "Michael Chen",
      email: "michael.chen@inventory.com",
      password: await hashPassword("Manager@2024"),
      role: UserRole.MANAGER,
      isActive: true,
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael",
      createdAt: generateRandomDate(70),
    },
    {
      name: "Emily Rodriguez",
      email: "emily.rodriguez@inventory.com",
      password: await hashPassword("Employee@2024"),
      role: UserRole.EMPLOYEE,
      isActive: true,
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emily",
      createdAt: generateRandomDate(60),
    },
    {
      name: "David Thompson",
      email: "david.thompson@inventory.com",
      password: await hashPassword("Employee@2024"),
      role: UserRole.EMPLOYEE,
      isActive: true,
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
      createdAt: generateRandomDate(55),
    },
    {
      name: "Jessica Martinez",
      email: "jessica.martinez@inventory.com",
      password: await hashPassword("Employee@2024"),
      role: UserRole.EMPLOYEE,
      isActive: true,
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jessica",
      createdAt: generateRandomDate(50),
    },
    {
      name: "Robert Williams",
      email: "robert.williams@inventory.com",
      password: await hashPassword("Employee@2024"),
      role: UserRole.EMPLOYEE,
      isActive: true,
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=robert",
      createdAt: generateRandomDate(45),
    },
    {
      name: "Amanda Brown",
      email: "amanda.brown@inventory.com",
      password: await hashPassword("Employee@2024"),
      role: UserRole.EMPLOYEE,
      isActive: true,
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=amanda",
      createdAt: generateRandomDate(40),
    },
    {
      name: "James Wilson",
      email: "james.wilson@inventory.com",
      password: await hashPassword("Employee@2024"),
      role: UserRole.EMPLOYEE,
      isActive: false,
      imageUrl: null,
      createdAt: generateRandomDate(35),
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.users.upsert({
      where: { email: userData.email },
      update: userData,
      create: userData,
    });
    createdUsers.push(user);
    console.log(`Created/Updated user: ${user.email}`);
  }

  return createdUsers;
}

// Seed Categories
async function seedCategories() {
  console.log("Seeding categories...");
  
  const categories = [
    {
      name: "Electronics",
      description: "Electronic devices and components including computers, smartphones, tablets, and accessories.",
      createdAt: generateRandomDate(85),
    },
    {
      name: "Office Supplies",
      description: "Essential office supplies including paper, pens, folders, and stationery items.",
      createdAt: generateRandomDate(80),
    },
    {
      name: "Furniture",
      description: "Office furniture including desks, chairs, cabinets, and storage solutions.",
      createdAt: generateRandomDate(75),
    },
    {
      name: "Accessories",
      description: "Various accessories including cables, adapters, cases, and protective equipment.",
      createdAt: generateRandomDate(70),
    },
    {
      name: "Software & Licenses",
      description: "Software licenses, subscriptions, and digital products.",
      createdAt: generateRandomDate(65),
    },
    {
      name: "Maintenance & Tools",
      description: "Maintenance equipment, tools, and supplies for facility management.",
      createdAt: generateRandomDate(60),
    },
  ];

  const createdCategories = [];
  for (const categoryData of categories) {
    const category = await prisma.categories.upsert({
      where: { name: categoryData.name },
      update: categoryData,
      create: categoryData,
    });
    createdCategories.push(category);
    console.log(`Created/Updated category: ${category.name}`);
  }

  return createdCategories;
}

// Seed Products
async function seedProducts(categories: any[]) {
  console.log("Seeding products...");
  
  const electronicsCategory = categories.find(c => c.name === "Electronics");
  const officeSuppliesCategory = categories.find(c => c.name === "Office Supplies");
  const furnitureCategory = categories.find(c => c.name === "Furniture");
  const accessoriesCategory = categories.find(c => c.name === "Accessories");
  const softwareCategory = categories.find(c => c.name === "Software & Licenses");
  const maintenanceCategory = categories.find(c => c.name === "Maintenance & Tools");

  const products = [
    // Electronics
    {
      name: "MacBook Pro 16-inch",
      description: "Apple MacBook Pro 16-inch with M3 Pro chip, 18GB RAM, 512GB SSD. Perfect for professional work and creative projects.",
      sku: generateSKU("ELEC", 1),
      categoryId: electronicsCategory?.categoryId,
      price: 2499.99,
      stockQuantity: 12,
      rating: 4.8,
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
      createdAt: generateRandomDate(80),
    },
    {
      name: "Dell XPS 15 Laptop",
      description: "Dell XPS 15 laptop with Intel i7 processor, 16GB RAM, 512GB SSD, 15.6-inch 4K display.",
      sku: generateSKU("ELEC", 2),
      categoryId: electronicsCategory?.categoryId,
      price: 1799.99,
      stockQuantity: 8,
      rating: 4.6,
      imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
      createdAt: generateRandomDate(75),
    },
    {
      name: "iPhone 15 Pro",
      description: "Apple iPhone 15 Pro with 256GB storage, A17 Pro chip, Pro camera system.",
      sku: generateSKU("ELEC", 3),
      categoryId: electronicsCategory?.categoryId,
      price: 999.99,
      stockQuantity: 25,
      rating: 4.9,
      imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
      createdAt: generateRandomDate(70),
    },
    {
      name: "Samsung Galaxy S24",
      description: "Samsung Galaxy S24 smartphone with 128GB storage, 6.2-inch display, triple camera system.",
      sku: generateSKU("ELEC", 4),
      categoryId: electronicsCategory?.categoryId,
      price: 799.99,
      stockQuantity: 18,
      rating: 4.7,
      imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400",
      createdAt: generateRandomDate(68),
    },
    {
      name: "iPad Air",
      description: "Apple iPad Air with M2 chip, 10.9-inch display, 256GB storage, Wi-Fi + Cellular.",
      sku: generateSKU("ELEC", 5),
      categoryId: electronicsCategory?.categoryId,
      price: 749.99,
      stockQuantity: 15,
      rating: 4.8,
      imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
      createdAt: generateRandomDate(65),
    },
    {
      name: "27-inch 4K Monitor",
      description: "LG UltraFine 27-inch 4K UHD IPS monitor with USB-C connectivity, perfect for professional work.",
      sku: generateSKU("ELEC", 6),
      categoryId: electronicsCategory?.categoryId,
      price: 599.99,
      stockQuantity: 20,
      rating: 4.5,
      imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400",
      createdAt: generateRandomDate(60),
    },
    {
      name: "Wireless Keyboard & Mouse",
      description: "Logitech MX Keys and MX Master 3 wireless keyboard and mouse combo for productivity.",
      sku: generateSKU("ELEC", 7),
      categoryId: electronicsCategory?.categoryId,
      price: 199.99,
      stockQuantity: 35,
      rating: 4.7,
      imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400",
      createdAt: generateRandomDate(55),
    },
    {
      name: "USB-C Hub",
      description: "Anker 7-in-1 USB-C Hub with HDMI, USB 3.0 ports, SD card reader, and power delivery.",
      sku: generateSKU("ELEC", 8),
      categoryId: electronicsCategory?.categoryId,
      price: 79.99,
      stockQuantity: 50,
      rating: 4.4,
      imageUrl: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400",
      createdAt: generateRandomDate(50),
    },
    
    // Office Supplies
    {
      name: "A4 Copy Paper (500 sheets)",
      description: "Premium A4 white copy paper, 80gsm, 500 sheets per ream. Suitable for all office printers.",
      sku: generateSKU("OFF", 1),
      categoryId: officeSuppliesCategory?.categoryId,
      price: 12.99,
      stockQuantity: 45,
      rating: 4.3,
      imageUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400",
      createdAt: generateRandomDate(75),
    },
    {
      name: "Ballpoint Pens (Pack of 12)",
      description: "Bic Cristal ballpoint pens, blue ink, pack of 12. Reliable and smooth writing experience.",
      sku: generateSKU("OFF", 2),
      categoryId: officeSuppliesCategory?.categoryId,
      price: 8.99,
      stockQuantity: 120,
      rating: 4.2,
      imageUrl: "https://images.unsplash.com/photo-1583484963886-47cee5a0c5c2?w=400",
      createdAt: generateRandomDate(70),
    },
    {
      name: "Stapler Heavy Duty",
      description: "Swingline heavy-duty stapler with 210 sheet capacity, black finish.",
      sku: generateSKU("OFF", 3),
      categoryId: officeSuppliesCategory?.categoryId,
      price: 24.99,
      stockQuantity: 30,
      rating: 4.5,
      imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
      createdAt: generateRandomDate(65),
    },
    {
      name: "File Folders (Pack of 50)",
      description: "Manila file folders, letter size, pack of 50. Perfect for organizing documents.",
      sku: generateSKU("OFF", 4),
      categoryId: officeSuppliesCategory?.categoryId,
      price: 19.99,
      stockQuantity: 60,
      rating: 4.1,
      imageUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400",
      createdAt: generateRandomDate(60),
    },
    {
      name: "Sticky Notes (Pack of 12)",
      description: "Post-it Notes, 3x3 inches, assorted colors, pack of 12 pads.",
      sku: generateSKU("OFF", 5),
      categoryId: officeSuppliesCategory?.categoryId,
      price: 15.99,
      stockQuantity: 80,
      rating: 4.6,
      imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
      createdAt: generateRandomDate(55),
    },
    {
      name: "Binder Clips (Assorted)",
      description: "Assorted binder clips, 19mm, 25mm, 32mm, pack of 100 pieces.",
      sku: generateSKU("OFF", 6),
      categoryId: officeSuppliesCategory?.categoryId,
      price: 9.99,
      stockQuantity: 90,
      rating: 4.0,
      imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
      createdAt: generateRandomDate(50),
    },
    {
      name: "Whiteboard Markers (Set of 8)",
      description: "Dry-erase markers, assorted colors, fine tip, set of 8 markers.",
      sku: generateSKU("OFF", 7),
      categoryId: officeSuppliesCategory?.categoryId,
      price: 11.99,
      stockQuantity: 40,
      rating: 4.4,
      imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
      createdAt: generateRandomDate(45),
    },
    
    // Furniture
    {
      name: "Ergonomic Office Chair",
      description: "Herman Miller Aeron ergonomic office chair, size B, adjustable lumbar support, mesh back.",
      sku: generateSKU("FURN", 1),
      categoryId: furnitureCategory?.categoryId,
      price: 1299.99,
      stockQuantity: 8,
      rating: 4.9,
      imageUrl: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400",
      createdAt: generateRandomDate(70),
    },
    {
      name: "Standing Desk Converter",
      description: "FlexiSpot standing desk converter, adjustable height, fits up to 27-inch monitors.",
      sku: generateSKU("FURN", 2),
      categoryId: furnitureCategory?.categoryId,
      price: 299.99,
      stockQuantity: 15,
      rating: 4.6,
      imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=400",
      createdAt: generateRandomDate(65),
    },
    {
      name: "Office Desk (60x30 inches)",
      description: "Modern office desk with drawers, 60x30 inches, white finish, cable management.",
      sku: generateSKU("FURN", 3),
      categoryId: furnitureCategory?.categoryId,
      price: 449.99,
      stockQuantity: 12,
      rating: 4.5,
      imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
      createdAt: generateRandomDate(60),
    },
    {
      name: "Filing Cabinet (2-drawer)",
      description: "Steel filing cabinet, 2-drawer, letter size, black finish, lockable drawers.",
      sku: generateSKU("FURN", 4),
      categoryId: furnitureCategory?.categoryId,
      price: 199.99,
      stockQuantity: 18,
      rating: 4.3,
      imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
      createdAt: generateRandomDate(55),
    },
    {
      name: "Bookshelf (5-tier)",
      description: "Wooden bookshelf, 5-tier, 72 inches tall, adjustable shelves, espresso finish.",
      sku: generateSKU("FURN", 5),
      categoryId: furnitureCategory?.categoryId,
      price: 179.99,
      stockQuantity: 10,
      rating: 4.4,
      imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400",
      createdAt: generateRandomDate(50),
    },
    
    // Accessories
    {
      name: "USB-C to USB-C Cable (6ft)",
      description: "Anker USB-C to USB-C cable, 6 feet, supports fast charging and data transfer.",
      sku: generateSKU("ACC", 1),
      categoryId: accessoriesCategory?.categoryId,
      price: 14.99,
      stockQuantity: 75,
      rating: 4.5,
      imageUrl: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400",
      createdAt: generateRandomDate(60),
    },
    {
      name: "Laptop Stand (Aluminum)",
      description: "Rain Design mStand laptop stand, aluminum, adjustable height, fits up to 17-inch laptops.",
      sku: generateSKU("ACC", 2),
      categoryId: accessoriesCategory?.categoryId,
      price: 59.99,
      stockQuantity: 25,
      rating: 4.7,
      imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400",
      createdAt: generateRandomDate(55),
    },
    {
      name: "Webcam HD 1080p",
      description: "Logitech C920 HD Pro webcam, 1080p, autofocus, built-in microphone.",
      sku: generateSKU("ACC", 3),
      categoryId: accessoriesCategory?.categoryId,
      price: 79.99,
      stockQuantity: 30,
      rating: 4.6,
      imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400",
      createdAt: generateRandomDate(50),
    },
    {
      name: "Laptop Sleeve (15-inch)",
      description: "Water-resistant laptop sleeve, 15-inch, neoprene material, multiple color options.",
      sku: generateSKU("ACC", 4),
      categoryId: accessoriesCategory?.categoryId,
      price: 29.99,
      stockQuantity: 40,
      rating: 4.3,
      imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
      createdAt: generateRandomDate(45),
    },
    {
      name: "Wireless Charger",
      description: "Anker wireless charging pad, Qi-compatible, fast charging, LED indicator.",
      sku: generateSKU("ACC", 5),
      categoryId: accessoriesCategory?.categoryId,
      price: 24.99,
      stockQuantity: 50,
      rating: 4.4,
      imageUrl: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400",
      createdAt: generateRandomDate(40),
    },
    
    // Software & Licenses
    {
      name: "Microsoft Office 365 Business",
      description: "Microsoft Office 365 Business license, annual subscription, includes Word, Excel, PowerPoint, Outlook.",
      sku: generateSKU("SOFT", 1),
      categoryId: softwareCategory?.categoryId,
      price: 99.99,
      stockQuantity: 100,
      rating: 4.8,
      imageUrl: null,
      createdAt: generateRandomDate(70),
    },
    {
      name: "Adobe Creative Cloud License",
      description: "Adobe Creative Cloud annual license, includes Photoshop, Illustrator, InDesign, and more.",
      sku: generateSKU("SOFT", 2),
      categoryId: softwareCategory?.categoryId,
      price: 599.99,
      stockQuantity: 20,
      rating: 4.7,
      imageUrl: null,
      createdAt: generateRandomDate(65),
    },
    {
      name: "Slack Pro License",
      description: "Slack Pro annual license per user, includes advanced features and integrations.",
      sku: generateSKU("SOFT", 3),
      categoryId: softwareCategory?.categoryId,
      price: 79.99,
      stockQuantity: 150,
      rating: 4.6,
      imageUrl: null,
      createdAt: generateRandomDate(60),
    },
    {
      name: "Zoom Business License",
      description: "Zoom Business annual license, includes video conferencing, webinars, and cloud storage.",
      sku: generateSKU("SOFT", 4),
      categoryId: softwareCategory?.categoryId,
      price: 199.99,
      stockQuantity: 50,
      rating: 4.5,
      imageUrl: null,
      createdAt: generateRandomDate(55),
    },
    
    // Maintenance & Tools
    {
      name: "Air Duster (12oz)",
      description: "Compressed air duster for cleaning electronics, keyboards, and hard-to-reach areas.",
      sku: generateSKU("MAINT", 1),
      categoryId: maintenanceCategory?.categoryId,
      price: 8.99,
      stockQuantity: 60,
      rating: 4.2,
      imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
      createdAt: generateRandomDate(50),
    },
    {
      name: "Screwdriver Set (20-piece)",
      description: "Professional screwdriver set with 20 pieces, various sizes, magnetic tips.",
      sku: generateSKU("MAINT", 2),
      categoryId: maintenanceCategory?.categoryId,
      price: 29.99,
      stockQuantity: 25,
      rating: 4.4,
      imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
      createdAt: generateRandomDate(45),
    },
    {
      name: "Cable Management Kit",
      description: "Cable management kit with cable ties, clips, and organizers for desk organization.",
      sku: generateSKU("MAINT", 3),
      categoryId: maintenanceCategory?.categoryId,
      price: 19.99,
      stockQuantity: 40,
      rating: 4.3,
      imageUrl: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400",
      createdAt: generateRandomDate(40),
    },
    {
      name: "Cleaning Wipes (Pack of 100)",
      description: "Screen cleaning wipes, safe for electronics, pack of 100 individually wrapped wipes.",
      sku: generateSKU("MAINT", 4),
      categoryId: maintenanceCategory?.categoryId,
      price: 12.99,
      stockQuantity: 80,
      rating: 4.1,
      imageUrl: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400",
      createdAt: generateRandomDate(35),
    },
  ];

  const createdProducts = [];
  for (const productData of products) {
    const product = await prisma.products.create({
      data: productData,
    });
    createdProducts.push(product);
    console.log(`Created product: ${product.name} (${product.sku})`);
  }

  return createdProducts;
}

// Seed Stock Movements
async function seedStockMovements(products: any[], users: any[]) {
  console.log("Seeding stock movements...");
  
  const employees = users.filter(u => u.role === UserRole.EMPLOYEE || u.role === UserRole.MANAGER);
  const movements = [];

  // Create various stock movements
  for (let i = 0; i < 30; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const user = employees[Math.floor(Math.random() * employees.length)];
    const movementType = Math.random() > 0.5 ? StockMovementType.ADJUSTMENT : StockMovementType.RETURN;
    
    const quantity = Math.floor(Math.random() * 20) + 1;
    const previousStock = product.stockQuantity;
    const newStock = movementType === StockMovementType.RETURN 
      ? previousStock + quantity 
      : Math.max(0, previousStock + (Math.random() > 0.5 ? quantity : -quantity));
    
    const reasons = [
      "Inventory correction",
      "Stock received",
      "Damaged goods return",
      "Cycle count adjustment",
      "Supplier return",
      "Quality control adjustment",
    ];

    const movement = await prisma.stockMovement.create({
      data: {
        productId: product.productId,
        userId: user.userId,
        movementType,
        quantity: movementType === StockMovementType.ADJUSTMENT 
          ? newStock - previousStock 
          : quantity,
        previousStock,
        newStock,
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        createdAt: generateRandomDate(30),
      },
    });

    // Update product stock
    await prisma.products.update({
      where: { productId: product.productId },
      data: { stockQuantity: newStock },
    });

    movements.push(movement);
  }

  console.log(`Created ${movements.length} stock movements`);
  return movements;
}

// Seed Audit Logs
async function seedAuditLogs(users: any[], products: any[], categories: any[]) {
  console.log("Seeding audit logs...");
  
  const admin = users.find(u => u.role === UserRole.ADMIN);
  const managers = users.filter(u => u.role === UserRole.MANAGER);
  const employees = users.filter(u => u.role === UserRole.EMPLOYEE);
  const allUsers = [...managers, ...employees];

  const logs = [];

  // Login events
  for (let i = 0; i < 50; i++) {
    const user = allUsers[Math.floor(Math.random() * allUsers.length)];
    logs.push({
      userId: user.userId,
      action: AuditAction.LOGIN,
      entityType: "User",
      entityId: user.userId,
      details: `User logged in: ${user.email}`,
      metadata: {
        email: user.email,
        role: user.role,
      },
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      createdAt: generateRandomDate(30),
    });
  }

  // Logout events
  for (let i = 0; i < 40; i++) {
    const user = allUsers[Math.floor(Math.random() * allUsers.length)];
    logs.push({
      userId: user.userId,
      action: AuditAction.LOGOUT,
      entityType: "User",
      entityId: user.userId,
      details: `User logged out: ${user.email}`,
      metadata: {
        email: user.email,
      },
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      createdAt: generateRandomDate(30),
    });
  }

  // Product creation logs
  for (const product of products.slice(0, 20)) {
    const user = managers[Math.floor(Math.random() * managers.length)];
    logs.push({
      userId: user.userId,
      action: AuditAction.CREATE,
      entityType: "Product",
      entityId: product.productId,
      details: `Product created: ${product.name} (Price: $${product.price}, Stock: ${product.stockQuantity})`,
      metadata: {
        productName: product.name,
        price: product.price,
        stockQuantity: product.stockQuantity,
        categoryId: product.categoryId || null,
      },
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      createdAt: product.createdAt,
    });
  }

  // Product update logs
  for (let i = 0; i < 25; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const user = managers[Math.floor(Math.random() * managers.length)];
    logs.push({
      userId: user.userId,
      action: AuditAction.UPDATE,
      entityType: "Product",
      entityId: product.productId,
      details: `Product updated: ${product.name}`,
      metadata: {
        changes: {
          price: { old: product.price * 0.9, new: product.price },
          stockQuantity: { old: product.stockQuantity - 5, new: product.stockQuantity },
        },
      },
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      createdAt: generateRandomDate(25),
    });
  }

  // Stock adjustment logs
  for (let i = 0; i < 20; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const user = allUsers[Math.floor(Math.random() * allUsers.length)];
    logs.push({
      userId: user.userId,
      action: AuditAction.STOCK_ADJUSTMENT,
      entityType: "Product",
      entityId: product.productId,
      details: `Stock adjusted for ${product.name}: ${product.stockQuantity - 10} → ${product.stockQuantity} (ADJUSTMENT)`,
      metadata: {
        productName: product.name,
        previousStock: product.stockQuantity - 10,
        newStock: product.stockQuantity,
        quantityChange: 10,
        movementType: "ADJUSTMENT",
        reason: "Inventory correction",
      },
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      createdAt: generateRandomDate(20),
    });
  }

  // Category creation logs
  for (const category of categories) {
    const user = admin || managers[0];
    logs.push({
      userId: user.userId,
      action: AuditAction.CREATE,
      entityType: "Category",
      entityId: category.categoryId,
      details: `Category created: ${category.name}${category.description ? ` (${category.description})` : ""}`,
      metadata: {
        categoryName: category.name,
        description: category.description || null,
      },
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      createdAt: category.createdAt,
    });
  }

  // User creation logs
  for (const user of users.slice(0, 5)) {
    if (admin) {
      logs.push({
        userId: admin.userId,
        action: AuditAction.CREATE,
        entityType: "User",
        entityId: user.userId,
        details: `User created: ${user.email} with role ${user.role}`,
        metadata: {
          userName: user.name,
          email: user.email,
          role: user.role,
        },
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        createdAt: user.createdAt,
      });
    }
  }

  // Create all audit logs
  for (const logData of logs) {
    await prisma.auditLog.create({
      data: logData,
    });
  }

  console.log(`Created ${logs.length} audit logs`);
  return logs;
}

// Seed Sales
async function seedSales(products: any[], users: any[]) {
  console.log("Seeding sales...");
  
  const employees = users.filter(u => u.role === UserRole.EMPLOYEE || u.role === UserRole.MANAGER);
  const sales = [];

  // Create sales transactions with better distribution
  // More sales in recent days, fewer in older days
  const totalSales = 80;
  
  for (let i = 0; i < totalSales; i++) {
    // Get a random product that has stock
    let product = products[Math.floor(Math.random() * products.length)];
    let attempts = 0;
    while (product.stockQuantity <= 0 && attempts < 10) {
      product = products[Math.floor(Math.random() * products.length)];
      attempts++;
    }
    
    if (product.stockQuantity <= 0) continue;
    
    const user = employees[Math.floor(Math.random() * employees.length)];
    
    // Vary quantities: 1-10 units, but don't exceed stock
    const maxQuantity = Math.min(10, product.stockQuantity);
    const quantity = Math.floor(Math.random() * maxQuantity) + 1;
    
    // Unit price: 85-115% of product price (allows for discounts and premiums)
    const priceVariation = 0.85 + Math.random() * 0.3;
    const unitPrice = Math.round(product.price * priceVariation * 100) / 100;
    const totalAmount = Math.round(quantity * unitPrice * 100) / 100;
    
    // Generate date with more recent bias (60% in last 30 days, 30% in 30-60 days, 10% in 60-90 days)
    let daysAgo;
    const rand = Math.random();
    if (rand < 0.6) {
      daysAgo = Math.floor(Math.random() * 30); // Last 30 days
    } else if (rand < 0.9) {
      daysAgo = 30 + Math.floor(Math.random() * 30); // 30-60 days
    } else {
      daysAgo = 60 + Math.floor(Math.random() * 30); // 60-90 days
    }
    
    const saleDate = generateRandomDate(daysAgo);
    
    const sale = await prisma.sales.create({
      data: {
        productId: product.productId,
        userId: user.userId,
        quantity,
        unitPrice,
        totalAmount,
        timestamp: saleDate,
      },
    });

    // Update product stock
    const previousStock = product.stockQuantity;
    const newStock = previousStock - quantity;
    await prisma.products.update({
      where: { productId: product.productId },
      data: { stockQuantity: newStock },
    });

    // Create stock movement
    await prisma.stockMovement.create({
      data: {
        productId: product.productId,
        userId: user.userId,
        movementType: StockMovementType.SALE,
        quantity: -quantity,
        previousStock,
        newStock,
        reason: `Sale: ${sale.saleId}`,
        createdAt: saleDate,
      },
    });

    // Update product stockQuantity for next iteration
    product.stockQuantity = newStock;
    sales.push(sale);
  }

  console.log(`Created ${sales.length} sales`);
  return sales;
}

// Seed Purchases
async function seedPurchases(products: any[], users: any[]) {
  console.log("Seeding purchases...");
  
  const managers = users.filter(u => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN);
  const purchases = [];

  // Create purchase transactions with better distribution
  const totalPurchases = 60;
  
  for (let i = 0; i < totalPurchases; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const user = managers[Math.floor(Math.random() * managers.length)];
    
    // Vary purchase quantities: 5-50 units
    const quantity = Math.floor(Math.random() * 46) + 5;
    
    // Unit cost: 50-75% of product price (wholesale cost)
    const costVariation = 0.5 + Math.random() * 0.25;
    const unitCost = Math.round(product.price * costVariation * 100) / 100;
    const totalCost = Math.round(quantity * unitCost * 100) / 100;
    
    // Generate date with distribution: 40% in last 30 days, 40% in 30-60 days, 20% in 60-90 days
    let daysAgo;
    const rand = Math.random();
    if (rand < 0.4) {
      daysAgo = Math.floor(Math.random() * 30); // Last 30 days
    } else if (rand < 0.8) {
      daysAgo = 30 + Math.floor(Math.random() * 30); // 30-60 days
    } else {
      daysAgo = 60 + Math.floor(Math.random() * 30); // 60-90 days
    }
    
    const purchaseDate = generateRandomDate(daysAgo);
    
    const purchase = await prisma.purchases.create({
      data: {
        productId: product.productId,
        userId: user.userId,
        quantity,
        unitCost,
        totalCost,
        timestamp: purchaseDate,
      },
    });

    // Update product stock
    const previousStock = product.stockQuantity;
    const newStock = previousStock + quantity;
    await prisma.products.update({
      where: { productId: product.productId },
      data: { stockQuantity: newStock },
    });

    // Create stock movement
    await prisma.stockMovement.create({
      data: {
        productId: product.productId,
        userId: user.userId,
        movementType: StockMovementType.PURCHASE,
        quantity,
        previousStock,
        newStock,
        reason: `Purchase: ${purchase.purchaseId}`,
        createdAt: purchaseDate,
      },
    });

    // Update product stockQuantity for next iteration
    product.stockQuantity = newStock;
    purchases.push(purchase);
  }

  console.log(`Created ${purchases.length} purchases`);
  return purchases;
}

// Seed Expenses
async function seedExpenses(users: any[]) {
  console.log("Seeding expenses...");
  
  const managers = users.filter(u => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN);
  
  const expenseTemplates = [
    {
      title: "Monthly Office Rent",
      description: "Office space rental for main headquarters building",
      category: "Office Rent",
      amountRange: [2000, 3000],
    },
    {
      title: "Electricity Bill",
      description: "Monthly electricity consumption charges",
      category: "Utilities",
      amountRange: [300, 500],
    },
    {
      title: "Water & Sewage",
      description: "Monthly water and sewage utility charges",
      category: "Utilities",
      amountRange: [150, 250],
    },
    {
      title: "Internet Service",
      description: "Monthly high-speed internet and network services",
      category: "Internet & Phone",
      amountRange: [150, 300],
    },
    {
      title: "Phone Service",
      description: "Business phone lines and mobile plans",
      category: "Internet & Phone",
      amountRange: [200, 400],
    },
    {
      title: "Office Supplies Order",
      description: "Bulk order of office supplies including paper, pens, folders",
      category: "Office Supplies",
      amountRange: [100, 500],
    },
    {
      title: "Printer Maintenance",
      description: "Regular maintenance and repair for office printers",
      category: "Maintenance",
      amountRange: [200, 600],
    },
    {
      title: "HVAC Service",
      description: "Heating, ventilation, and air conditioning maintenance",
      category: "Maintenance",
      amountRange: [300, 800],
    },
    {
      title: "Digital Marketing Campaign",
      description: "Social media advertising and online marketing campaign",
      category: "Marketing",
      amountRange: [500, 2000],
    },
    {
      title: "Print Advertising",
      description: "Newspaper and magazine advertising expenses",
      category: "Marketing",
      amountRange: [300, 1000],
    },
    {
      title: "Legal Consultation",
      description: "Professional legal services and consultation fees",
      category: "Professional Services",
      amountRange: [1000, 3000],
    },
    {
      title: "Accounting Services",
      description: "Monthly accounting and bookkeeping services",
      category: "Professional Services",
      amountRange: [800, 2000],
    },
    {
      title: "Business Insurance Premium",
      description: "Monthly business insurance premium payment",
      category: "Insurance",
      amountRange: [500, 1500],
    },
    {
      title: "Employee Training Program",
      description: "Professional development and training courses for employees",
      category: "Training",
      amountRange: [500, 3000],
    },
    {
      title: "Conference Attendance",
      description: "Business conference registration and travel expenses",
      category: "Travel",
      amountRange: [800, 2000],
    },
    {
      title: "Client Meeting Travel",
      description: "Travel expenses for client meetings and site visits",
      category: "Travel",
      amountRange: [300, 1500],
    },
    {
      title: "Equipment Purchase",
      description: "Purchase of office equipment and furniture",
      category: "Office Supplies",
      amountRange: [500, 2000],
    },
    {
      title: "Software License Renewal",
      description: "Annual software license renewal fees",
      category: "Professional Services",
      amountRange: [1000, 5000],
    },
    {
      title: "Cleaning Services",
      description: "Monthly professional cleaning services",
      category: "Maintenance",
      amountRange: [200, 500],
    },
    {
      title: "Security System Maintenance",
      description: "Security system monitoring and maintenance fees",
      category: "Maintenance",
      amountRange: [150, 400],
    },
  ];

  const expenses = [];

  // Create expenses with realistic data
  for (let i = 0; i < 80; i++) {
    const template = expenseTemplates[Math.floor(Math.random() * expenseTemplates.length)];
    const user = managers[Math.floor(Math.random() * managers.length)];
    const [minAmount, maxAmount] = template.amountRange;
    const amount = Math.random() * (maxAmount - minAmount) + minAmount;

    const expense = await prisma.expenses.create({
      data: {
        title: template.title,
        description: template.description,
        category: template.category,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
        userId: user.userId,
        timestamp: generateRandomDate(90), // Spread across last 90 days
      },
    });

    expenses.push(expense);
  }

  console.log(`Created ${expenses.length} expenses`);
  return expenses;
}

// Main seed function
async function main() {
  try {
    console.log("Starting database seeding...");
    
    // Clear existing data
    await clearAllData();
    
    // Seed in order
    const users = await seedUsers();
    const categories = await seedCategories();
    const products = await seedProducts(categories);
    const sales = await seedSales(products, users);
    const purchases = await seedPurchases(products, users);
    const expenses = await seedExpenses(users);
    const stockMovements = await seedStockMovements(products, users);
    const auditLogs = await seedAuditLogs(users, products, categories);
    
    console.log("\n✅ Seeding completed successfully!");
    console.log(`- Users: ${users.length}`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Sales: ${sales.length}`);
    console.log(`- Purchases: ${purchases.length}`);
    console.log(`- Expenses: ${expenses.length}`);
    console.log(`- Stock Movements: ${stockMovements.length}`);
    console.log(`- Audit Logs: ${auditLogs.length}`);
    console.log("\n📝 Login credentials:");
    console.log("   Admin: admin@inventory.com / Admin@2024");
    console.log("   Manager: sarah.johnson@inventory.com / Manager@2024");
    console.log("   Employee: emily.rodriguez@inventory.com / Employee@2024");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
