import { prisma } from "../config/database";
import { ConflictError, NotFoundError } from "../utils/errors";

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
}

export const getCategories = async () => {
  return prisma.categories.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
};

export const getCategory = async (categoryId: string) => {
  const category = await prisma.categories.findUnique({
    where: { categoryId },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new NotFoundError("Category");
  }

  return category;
};

export const createCategory = async (data: CreateCategoryData) => {
  // Check if category with same name already exists
  const existingCategory = await prisma.categories.findUnique({
    where: { name: data.name },
  });

  if (existingCategory) {
    throw new ConflictError("Category with this name already exists");
  }

  return prisma.categories.create({
    data: {
      name: data.name,
      description: data.description,
    },
  });
};

export const updateCategory = async (
  categoryId: string,
  data: UpdateCategoryData
) => {
  const existingCategory = await prisma.categories.findUnique({
    where: { categoryId },
  });

  if (!existingCategory) {
    throw new NotFoundError("Category");
  }

  // If name is being updated, check for conflicts
  if (data.name && data.name !== existingCategory.name) {
    const nameConflict = await prisma.categories.findUnique({
      where: { name: data.name },
    });

    if (nameConflict) {
      throw new ConflictError("Category with this name already exists");
    }
  }

  return prisma.categories.update({
    where: { categoryId },
    data,
  });
};

export const deleteCategory = async (categoryId: string) => {
  const category = await prisma.categories.findUnique({
    where: { categoryId },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new NotFoundError("Category");
  }

  // Prevent deletion if category has products
  if (category._count.products > 0) {
    throw new ConflictError(
      `Cannot delete category. ${category._count.products} product(s) are using this category.`
    );
  }

  return prisma.categories.delete({
    where: { categoryId },
  });
};

