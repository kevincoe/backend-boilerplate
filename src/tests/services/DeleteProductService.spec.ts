import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { DeleteProductService } from "../../services/DeleteProductService";
import { AppError } from "../../errors/AppError";
import { Prisma } from "@prisma/client";

describe("DeleteProductService", () => {
  let productRepositoryMock: Record<string, Mock>;
  let deleteProductService: DeleteProductService;

  beforeEach(() => {
    productRepositoryMock = {
      update: vi.fn(),
      delete: vi.fn(),
    };

    deleteProductService = new DeleteProductService(
      productRepositoryMock as unknown as import("../../repositories/ProductRepository").ProductRepository
    );
  });

  it("should throw an error if product is not found", async () => {
    (productRepositoryMock.update as Mock).mockResolvedValue(null);

    await expect(deleteProductService.execute("invalid-id")).rejects.toThrow(
      new AppError("Produto não encontrado.", 404)
    );
  });

  it("should throw an error if product has rented or reserved assets", async () => {
    (productRepositoryMock.update as Mock).mockResolvedValue({
      id: "prod-1",
      assets: [
        { id: "asset-1", state: "AVAILABLE" },
        { id: "asset-2", state: "RENTED" },
      ],
    });

    await expect(deleteProductService.execute("prod-1")).rejects.toThrow(
      new AppError(
        "Não é possível excluir este produto pois existem equipamentos alugados ou reservados associados a ele. Remova-os do estoque disponível primeiro.",
        400
      )
    );
  });

  it("should delete the product if all assets are AVAILABLE", async () => {
    (productRepositoryMock.update as Mock).mockResolvedValue({
      id: "prod-1",
      assets: [
        { id: "asset-1", state: "AVAILABLE" },
        { id: "asset-2", state: "AVAILABLE" },
      ],
    });

    const result = await deleteProductService.execute("prod-1");

    expect(productRepositoryMock.delete).toHaveBeenCalledWith("prod-1");
    expect(result).toEqual({ success: true });
  });

  it("should gracefully handle Prisma P2003 foreign key constraint errors", async () => {
    (productRepositoryMock.update as Mock).mockResolvedValue({
      id: "prod-1",
      assets: [{ id: "asset-1", state: "AVAILABLE" }],
    });

    // Simulate a foreign key constraint failure
    const prismaError = new Prisma.PrismaClientKnownRequestError("Foreign key constraint failed", {
      code: "P2003",
      clientVersion: "7.8.0",
    });
    
    (productRepositoryMock.delete as Mock).mockRejectedValue(prismaError);

    await expect(deleteProductService.execute("prod-1")).rejects.toThrow(
      new AppError(
        "Não é possível excluir este produto pois ele possui histórico de locações em pedidos anteriores. Considere zerar o estoque dele em vez de excluí-lo.",
        400
      )
    );
  });
});
