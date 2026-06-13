require("dotenv").config();

const pkg = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

const { PrismaClient } = pkg;
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
    price: 6.0,
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
    name: "Pan con pollo",
    description: "Sándwich de pollo con lechuga y mayonesa.",
    category: "Sánguches",
    price: 7.5,
    stock: 15,
    image: "sandwich"
  },
  {
    name: "Empanada de carne",
    description: "Empanada horneada rellena de carne.",
    category: "Snacks",
    price: 5.0,
    stock: 22,
    image: "empanada"
  },
  {
    name: "Menú ejecutivo",
    description: "Plato de fondo, bebida y postre del día.",
    category: "Menús",
    price: 15.0,
    stock: 12,
    image: "menu"
  },
  {
    name: "Brownie",
    description: "Postre de chocolate individual.",
    category: "Postres",
    price: 4.0,
    stock: 16,
    image: "brownie"
  },
  {
    name: "Agua mineral",
    description: "Botella personal de agua sin gas.",
    category: "Bebidas frías",
    price: 3.0,
    stock: 30,
    image: "water"
  }
];

async function main() {
  console.log("Iniciando carga inicial de datos...");

  for (const categoryName of categories) {
    await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName }
    });
  }

  for (const product of products) {
    const category = await prisma.category.findUnique({
      where: { name: product.category }
    });

    const existingProduct = await prisma.product.findFirst({
      where: { name: product.name }
    });

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          description: product.description,
          price: product.price,
          stock: product.stock,
          image: product.image,
          isActive: true,
          categoryId: category.id
        }
      });
    } else {
      await prisma.product.create({
        data: {
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          image: product.image,
          isActive: true,
          categoryId: category.id
        }
      });
    }
  }

  console.log("Datos iniciales cargados correctamente.");
}

main()
  .catch((error) => {
    console.error("Error cargando datos iniciales:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });