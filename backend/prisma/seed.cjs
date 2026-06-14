const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const pg = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter
});

const categories = [
  "Bebidas calientes",
  "Bebidas frías",
  "Sánguches",
  "Snacks",
  "Menús",
  "Postres"
];

const products = [
  {
    name: "Café americano",
    description: "Café negro clásico servido caliente.",
    category: "Bebidas calientes",
    price: 4.5,
    stock: 25,
    image: "coffee"
  },
  {
    name: "Capuccino",
    description: "Café con leche vaporizada y espuma.",
    category: "Bebidas calientes",
    price: 6,
    stock: 18,
    image: "cappuccino"
  },
  {
    name: "Jugo de naranja",
    description: "Jugo natural de naranja recién preparado.",
    category: "Bebidas frías",
    price: 5.5,
    stock: 20,
    image: "juice"
  },
  {
    name: "Agua mineral",
    description: "Botella personal de agua sin gas.",
    category: "Bebidas frías",
    price: 3,
    stock: 30,
    image: "water"
  },
  {
    name: "Pan con pollo",
    description: "Sándwich de pollo con lechuga y mayonesa.",
    category: "Sánguches",
    price: 7.5,
    stock: 15,
    image: "sandwich"
  },
  {
    name: "Triple de pollo",
    description: "Sándwich triple con pollo, palta, huevo y mayonesa.",
    category: "Sánguches",
    price: 9,
    stock: 24,
    image: "triple"
  },
  {
    name: "Empanada de carne",
    description: "Empanada horneada rellena de carne.",
    category: "Snacks",
    price: 5,
    stock: 22,
    image: "empanada"
  },
  {
    name: "Menú ejecutivo",
    description: "Plato de fondo, bebida y postre del día.",
    category: "Menús",
    price: 15,
    stock: 12,
    image: "menu"
  },
  {
    name: "Brownie",
    description: "Postre de chocolate individual.",
    category: "Postres",
    price: 4,
    stock: 16,
    image: "brownie"
  }
];

const users = [
  {
    name: "Administrador USIL",
    email: "admin@usil.edu.pe",
    password: "Admin123",
    role: "ADMIN"
  },
  {
    name: "Personal de Cafetería",
    email: "cafeteria@usil.edu.pe",
    password: "Cafe123",
    role: "CAFETERIA"
  },
  {
    name: "Personal de Cocina",
    email: "cocina@usil.edu.pe",
    password: "Cocina123",
    role: "COCINA"
  }
];

const seedCategories = async () => {
  const categoryMap = {};

  for (const categoryName of categories) {
    const category = await prisma.category.upsert({
      where: {
        name: categoryName
      },
      update: {
        name: categoryName
      },
      create: {
        name: categoryName
      }
    });

    categoryMap[categoryName] = category;
  }

  return categoryMap;
};

const seedProducts = async (categoryMap) => {
  for (const product of products) {
    const category = categoryMap[product.category];

    if (!category) {
      throw new Error(`Categoría no encontrada: ${product.category}`);
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        name: product.name
      }
    });

    const productData = {
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      image: product.image,
      isActive: true,
      categoryId: category.id
    };

    if (existingProduct) {
      await prisma.product.update({
        where: {
          id: existingProduct.id
        },
        data: productData
      });
    } else {
      await prisma.product.create({
        data: productData
      });
    }
  }
};

const seedUsers = async () => {
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: {
        email: user.email
      },
      update: {
        name: user.name,
        password: hashedPassword,
        role: user.role,
        isActive: true
      },
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        isActive: true
      }
    });
  }
};

const main = async () => {
  console.log("=====================================");
  console.log("Iniciando carga inicial de datos...");
  console.log("=====================================");

  const categoryMap = await seedCategories();

  await seedProducts(categoryMap);
  await seedUsers();

  console.log("Categorías cargadas:", categories.length);
  console.log("Productos cargados:", products.length);
  console.log("Usuarios demo cargados:", users.length);

  console.log("=====================================");
  console.log("Datos iniciales cargados correctamente.");
  console.log("=====================================");
};

main()
  .catch((error) => {
    console.error("Error cargando datos iniciales:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });