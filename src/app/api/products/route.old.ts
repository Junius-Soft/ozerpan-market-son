// import { NextResponse } from "next/server";
// import fs from "fs/promises";
// import path from "path";
// import type { ProductsResponse, ProductTab } from "@/documents/products";

// interface ProductItem {
//   manufacturer_code: string;
//   product_id: string;
//   stock_code: string;
//   material_name: string;
//   unit: string;
//   unit_price: number;
//   currency: string;
//   product_group: string;
//   brand?: string;
//   supplier: string;
//   description: string;
//   tickness?: number;
//   product_type?: string;
// }

// interface ProductItems {
//   items: ProductItem[];
// }

// const productsFilePath = path.join(process.cwd(), "data", "products.json");
// const productItemsFilePath = path.join(
//   process.cwd(),
//   "data",
//   "product-items.json"
// );

// // GET /api/products
// export async function GET() {
//   try {
//     // Read both files
//     const [productsData, productItemsData] = await Promise.all([
//       fs.readFile(productsFilePath, "utf8"),
//       fs.readFile(productItemsFilePath, "utf8"),
//     ]);

//     const products = JSON.parse(productsData) as ProductsResponse;
//     const productItems = JSON.parse(productItemsData) as ProductItems;

//     // Find panjur product
//     const panjurProduct = products.products.find((p) => p.id === "panjur");
//     if (panjurProduct) {
//       // Get receiver options from product-items
//       const receiverOptions = [
//         { id: "yok", name: "Yok" }, // Default "Yok" option
//         ...productItems.items
//           .filter(
//             (item) =>
//               item.product_id === "panjur" && item.product_group === "receiver"
//           )
//           .map((item) => ({
//             id: item.manufacturer_code.toLowerCase(),
//             name: item.material_name,
//           })),
//       ];

//       // Get remote options from product-items
//       const remoteOptions = [
//         { id: "yok", name: "Yok" }, // Default "Yok" option
//         ...productItems.items
//           .filter(
//             (item) =>
//               item.product_id === "panjur" && item.product_group === "remote"
//           )
//           .map((item) => ({
//             id: item.manufacturer_code.toLowerCase(),
//             name: item.material_name,
//           })),
//       ];

//       // Get smarthome options from product-items
//       const smarthomeOptions = [
//         { id: "yok", name: "Yok" }, // Default "Yok" option
//         ...productItems.items
//           .filter(
//             (item) =>
//               item.product_id === "panjur" && item.product_group === "smarthome"
//           )
//           .map((item) => ({
//             id: item.manufacturer_code.toLowerCase(),
//             name: item.material_name,
//           })),
//       ];

//       // Find movement tab
//       const movementTab = panjurProduct.tabs?.find(
//         (tab: ProductTab) => tab.id === "movement"
//       );
//       if (movementTab?.content) {
//         // Update receiver field if it exists
//         const receiverField = movementTab.content.fields.find(
//           (field) => field.id === "receiver"
//         );
//         if (receiverField) {
//           receiverField.options = receiverOptions;
//           receiverField.default = "yok";
//         }

//         // Update remote field if it exists
//         const remoteField = movementTab.content.fields.find(
//           (field) => field.id === "remote"
//         );
//         if (remoteField) {
//           remoteField.options = remoteOptions;
//           remoteField.default = "yok";
//         }

//         // Update smarthome field if it exists
//         const smarthomeField = movementTab.content.fields.find(
//           (field) => field.id === "smarthome"
//         );
//         if (smarthomeField) {
//           smarthomeField.options = smarthomeOptions;
//           smarthomeField.default = "yok";
//         }

//         // Find motorMarka field
//         const motorMarkaField = movementTab.content.fields.find(
//           (field) => field.id === "motorMarka"
//         );
//         if (motorMarkaField) {
//           // Get distinct motor brands from product-items
//           const motorBrands = Array.from(
//             new Set(
//               productItems.items
//                 .filter(
//                   (item) =>
//                     item.product_id === "panjur" &&
//                     item.product_group === "panjur_motors" &&
//                     item.brand
//                 )
//                 .map((item) => item.brand!)
//             )
//           ).map((brand) => ({
//             id: brand.toLowerCase(),
//             name: brand,
//           }));

//           // Update options with dynamic brands
//           motorMarkaField.options = motorBrands;
//           motorMarkaField.default = motorBrands[0]?.id || "mosel";

//           // Find motorModel field
//           const motorModelField = movementTab.content.fields.find(
//             (field) => field.id === "motorModel"
//           );
//           if (motorModelField) {
//             // Get all motor models without filtering by brand
//             const allMotorModels = productItems.items
//               .filter(
//                 (item) =>
//                   item.product_id === "panjur" &&
//                   item.product_group === "panjur_motors"
//               )
//               .map((item) => ({
//                 id: item.manufacturer_code.toLowerCase(),
//                 name: item.material_name,
//                 brand: item.brand?.toLowerCase(), // Add brand info for frontend filtering
//               }));

//             // Set all models as options
//             motorModelField.options = allMotorModels;

//             // Set default model based on default brand
//             const defaultModel = allMotorModels.find(
//               (model) => model.brand === motorMarkaField.default
//             );
//             motorModelField.default = defaultModel?.id || "";
//           }
//         }
//       }
//     }

//     return NextResponse.json(products);
//   } catch (error) {
//     console.error("Error reading products:", error);
//     return NextResponse.json(
//       { error: "Failed to read products" },
//       { status: 500 }
//     );
//   }
// }
