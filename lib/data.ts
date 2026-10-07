import { Product } from '@/types';

export const mockProducts: Product[] = [
  {
    "id": "l1",
    "title": "MacBook Pro 16\" M3 Max",
    "slug": "macbook-pro-16-m3-max",
    "description": "The ultimate pro laptop with the incredibly fast M3 Max chip. 64GB RAM, 2TB SSD.",
    "price": 4500000,
    "stock_quantity": 10,
    "images": [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80"
    ],
    "is_service": false,
    "brand": "Apple",
    "category": "Laptops",
    "subcategory": "MacBooks"
  },
  {
    "id": "l2",
    "title": "MacBook Air 15\" M3",
    "slug": "macbook-air-15-m3",
    "description": "Supercharged by M3, incredibly thin and light. 16GB RAM, 512GB SSD.",
    "price": 1800000,
    "stock_quantity": 25,
    "images": [
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80"
    ],
    "is_service": false,
    "brand": "Apple",
    "category": "Laptops",
    "subcategory": "MacBooks"
  },
  {
    "id": "l3",
    "title": "HP Spectre x360 14",
    "slug": "hp-spectre-x360-14",
    "description": "Premium 2-in-1 convertible laptop. Intel Core Ultra 7, 32GB RAM, 1TB SSD.",
    "price": 1950000,
    "stock_quantity": 15,
    "images": [
      "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&q=80"
    ],
    "is_service": false,
    "brand": "HP",
    "category": "Laptops",
    "subcategory": "HP"
  },
  {
    "id": "l4",
    "title": "Dell XPS 15",
    "slug": "dell-xps-15",
    "description": "Stunning 4K OLED display, perfect for creators. Intel Core i9, 32GB RAM, 1TB SSD, RTX 4070.",
    "price": 2800000,
    "stock_quantity": 12,
    "images": [
      "https://ftyvnkssowiedoymxvsn.supabase.co/storage/v1/object/public/product-images/dell-xps-15.jpg"
    ],
    "is_service": false,
    "brand": "Dell",
    "category": "Laptops",
    "subcategory": "Dell"
  },
  {
    "id": "l5",
    "title": "ASUS ROG Zephyrus G14",
    "slug": "asus-rog-zephyrus-g14",
    "description": "High-performance gaming laptop in a compact form factor. AMD Ryzen 9, RTX 4060, 16GB RAM, 1TB SSD.",
    "price": 2100000,
    "stock_quantity": 8,
    "images": [
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80"
    ],
    "is_service": false,
    "brand": "Asus",
    "category": "Laptops",
    "subcategory": "Asus"
  },
  {
    "id": "p1",
    "title": "iPhone 15 Pro Max (256GB)",
    "slug": "iphone-15-pro-max-256gb",
    "description": "Forged in titanium. A17 Pro chip. The ultimate iPhone experience.",
    "price": 1950000,
    "stock_quantity": 40,
    "images": [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80"
    ],
    "is_service": false,
    "brand": "Apple",
    "category": "Phones",
    "subcategory": "iPhones"
  },
  {
    "id": "p2",
    "title": "Samsung Galaxy S24 Ultra",
    "slug": "samsung-galaxy-s24-ultra",
    "description": "Galaxy AI is here. 200MP camera, built-in S Pen, titanium exterior.",
    "price": 1850000,
    "stock_quantity": 35,
    "images": [
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80"
    ],
    "is_service": false,
    "brand": "Samsung",
    "category": "Phones",
    "subcategory": "Samsung"
  },
  {
    "id": "p3",
    "title": "Google Pixel 8 Pro",
    "slug": "google-pixel-8-pro",
    "description": "The best of Google AI. Amazing camera, 7 years of updates.",
    "price": 1100000,
    "stock_quantity": 20,
    "images": [
      "https://ftyvnkssowiedoymxvsn.supabase.co/storage/v1/object/public/product-images/google-pixel-8-pro.jpg"
    ],
    "is_service": false,
    "brand": "Google",
    "category": "Phones",
    "subcategory": "Google Pixels"
  },
  {
    "id": "p4",
    "title": "Xiaomi 14 Ultra",
    "slug": "xiaomi-14-ultra",
    "description": "Leica co-engineered cameras. SnapDragon 8 Gen 3.",
    "price": 1400000,
    "stock_quantity": 15,
    "images": [
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80"
    ],
    "is_service": false,
    "brand": "Xiaomi",
    "category": "Phones",
    "subcategory": "Xiaomi"
  },
  {
    "id": "a1",
    "title": "Logitech MX Master 3S",
    "slug": "logitech-mx-master-3s",
    "description": "The ultimate wireless productivity mouse. Quiet clicks, 8K DPI.",
    "price": 120000,
    "stock_quantity": 50,
    "images": [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80"
    ],
    "is_service": false,
    "brand": "Logitech",
    "category": "Accessories",
    "subcategory": "Mouse"
  },
  {
    "id": "a2",
    "title": "Razer DeathAdder V3 Pro",
    "slug": "razer-deathadder-v3-pro",
    "description": "Ultra-lightweight wireless ergonomic esports gaming mouse.",
    "price": 150000,
    "stock_quantity": 30,
    "images": [
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80"
    ],
    "is_service": false,
    "brand": "Razer",
    "category": "Accessories",
    "subcategory": "Mouse"
  },
  {
    "id": "a3",
    "title": "Samsung 990 PRO NVMe M.2 SSD 2TB",
    "slug": "samsung-990-pro-nvme-2tb",
    "description": "Blazing fast PCIe 4.0 NVMe SSD. Up to 7450 MB/s read speed.",
    "price": 250000,
    "stock_quantity": 60,
    "images": [
      "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&q=80"
    ],
    "is_service": false,
    "brand": "Samsung",
    "category": "Accessories",
    "subcategory": "SSDs"
  },
  {
    "id": "a4",
    "title": "Crucial X9 Pro Portable SSD 1TB",
    "slug": "crucial-x9-pro-portable-ssd-1tb",
    "description": "High-performance portable SSD for creators. USB-C.",
    "price": 140000,
    "stock_quantity": 45,
    "images": [
      "https://ftyvnkssowiedoymxvsn.supabase.co/storage/v1/object/public/product-images/crucial-x9-pro-portable-ssd-1tb.jpg"
    ],
    "is_service": false,
    "brand": "Crucial",
    "category": "Accessories",
    "subcategory": "SSDs"
  },
  {
    "id": "a5",
    "title": "Seagate BarraCuda 2TB Internal HDD",
    "slug": "seagate-barracuda-2tb-hdd",
    "description": "Versatile, fast, and dependable 3.5-inch hard drive.",
    "price": 85000,
    "stock_quantity": 100,
    "images": [
      "https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=800&q=80"
    ],
    "is_service": false,
    "brand": "Seagate",
    "category": "Accessories",
    "subcategory": "HDDs"
  },
  {
    "id": "a6",
    "title": "SanDisk Ultra Dual Drive USB Type-C 128GB",
    "slug": "sandisk-ultra-dual-drive-128gb",
    "description": "Easily free up space on your smartphone or transfer files between devices.",
    "price": 25000,
    "stock_quantity": 200,
    "images": [
      "https://ftyvnkssowiedoymxvsn.supabase.co/storage/v1/object/public/product-images/sandisk-ultra-dual-drive-128gb.jpg"
    ],
    "is_service": false,
    "brand": "SanDisk",
    "category": "Accessories",
    "subcategory": "SanDisk flash drives"
  },
  {
    "id": "a7",
    "title": "UGREEN M.2 NVMe SSD Enclosure 10Gbps",
    "slug": "ugreen-nvme-ssd-enclosure",
    "description": "Tool-free USB C 3.2 Gen 2 aluminum enclosure for NVMe PCIe M-Key.",
    "price": 35000,
    "stock_quantity": 80,
    "images": [
      "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=800&q=80"
    ],
    "is_service": false,
    "brand": "UGREEN",
    "category": "Accessories",
    "subcategory": "SSD Enclosure"
  },
  {
    "id": "a8",
    "title": "Orico 2.5 inch HDD Enclosure USB 3.0",
    "slug": "orico-hdd-enclosure-3",
    "description": "Transparent external hard drive case for 2.5\" SATA HDD/SSD.",
    "price": 15000,
    "stock_quantity": 120,
    "images": [
      "https://ftyvnkssowiedoymxvsn.supabase.co/storage/v1/object/public/product-images/orico-hdd-enclosure-3.jpg"
    ],
    "is_service": false,
    "brand": "Orico",
    "category": "Accessories",
    "subcategory": "HDD enclosure 3.0"
  },
  {
    "id": "n1",
    "title": "Starlink Standard Kit",
    "slug": "starlink-standard-kit",
    "description": "High-speed, low-latency broadband internet. Includes WiFi router, power supply, and cables.",
    "price": 440000,
    "stock_quantity": 50,
    "images": [
      "https://ftyvnkssowiedoymxvsn.supabase.co/storage/v1/object/public/product-images/starlink-standard-kit.jpg"
    ],
    "is_service": false,
    "brand": "SpaceX",
    "category": "Networking",
    "subcategory": "Starlink"
  },
  {
    "id": "n2",
    "title": "TP-Link Deco BE85 Wi-Fi 7 Mesh",
    "slug": "tp-link-deco-be85",
    "description": "Next-gen Wi-Fi 7 mesh system for whole-home coverage and extreme speeds.",
    "price": 850000,
    "stock_quantity": 10,
    "images": [
      "https://images.unsplash.com/photo-1544654803-b69140b285a1?w=800&q=80"
    ],
    "is_service": false,
    "brand": "TP-Link",
    "category": "Networking",
    "subcategory": "Routers"
  },
  {
    "id": "s1",
    "title": "Ubiquiti UniFi Protect G4 Pro Camera",
    "slug": "ubiquiti-unifi-protect-g4-pro",
    "description": "4K video resolution, 3x optical zoom, and high-power infrared LEDs for night vision.",
    "price": 450000,
    "stock_quantity": 20,
    "images": [
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80"
    ],
    "is_service": false,
    "brand": "Ubiquiti",
    "category": "Security",
    "subcategory": "CCTV"
  }
];
