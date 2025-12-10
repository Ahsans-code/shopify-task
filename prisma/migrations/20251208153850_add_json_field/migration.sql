-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GeneratedProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "shopifyId" TEXT,
    "productJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_GeneratedProduct" ("createdAt", "description", "id", "imageUrl", "shop", "shopifyId", "status", "title") SELECT "createdAt", "description", "id", "imageUrl", "shop", "shopifyId", "status", "title" FROM "GeneratedProduct";
DROP TABLE "GeneratedProduct";
ALTER TABLE "new_GeneratedProduct" RENAME TO "GeneratedProduct";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
