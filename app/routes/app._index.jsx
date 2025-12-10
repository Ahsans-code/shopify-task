// import { useLoaderData, useNavigate, useFetcher } from "react-router"; // useFetcher add kiya
// import {
//   Page,
//   Layout,
//   Card,
//   IndexTable,
//   useIndexResourceState,
//   Text,
//   Badge,
//   Button,
//   InlineStack,
//   Box,
//   Tooltip
// } from "@shopify/polaris";
// import { DeleteIcon } from "@shopify/polaris-icons"; // Icon import kiya
// import { authenticate } from "../shopify.server";
// import prisma from "../db.server";

// // Loader: Data lane ke liye
// export const loader = async ({ request }) => {
//   await authenticate.admin(request);
//   const tickets = await prisma.ticket.findMany({
//     orderBy: { createdAt: "desc" },
//   });
//   return { tickets };
// };

// // Action: Data delete karne ke liye (Backend Logic)
// export const action = async ({ request }) => {
//   await authenticate.admin(request);
//   const formData = await request.formData();

//   // Form se ID uthao aur delete karo
//   const ticketId = formData.get("id");

//   if (ticketId) {
//     await prisma.ticket.delete({
//       where: { id: parseInt(ticketId) },
//     });
//   }

//   return { success: true };
// };

// export default function Index() {
//   const { tickets } = useLoaderData();
//   const navigate = useNavigate();
//   const fetcher = useFetcher(); // Background request ke liye

//   const resourceName = {
//     singular: "ticket",
//     plural: "tickets",
//   };

//   const { selectedResources, allResourcesSelected, handleSelectionChange } =
//     useIndexResourceState(tickets);

//   const rowMarkup = tickets.map(
//     ({ id, title, status, createdAt }, index) => (
//       <IndexTable.Row
//         id={id}
//         key={id}
//         selected={selectedResources.includes(id)}
//         position={index}
//         onClick={() => navigate(`/app/ticket/${id}`)}
//       >
//         <IndexTable.Cell>
//           <Text variant="bodyMd" fontWeight="bold" as="span">
//             {id}
//           </Text>
//         </IndexTable.Cell>
//         <IndexTable.Cell>{title}</IndexTable.Cell>
//         <IndexTable.Cell>
//           <Badge tone={status === "Pending" ? "attention" : "success"}>
//             {status}
//           </Badge>
//         </IndexTable.Cell>
//         <IndexTable.Cell>
//           {new Date(createdAt).toLocaleDateString("en-GB").replace(/\//g, '-')}
//         </IndexTable.Cell>
//         <IndexTable.Cell>
//           {/* Action Column: View aur Delete Buttons */}
//           <InlineStack gap="200" wrap={false}>

//             <Button
//               size="slim"
//               variant="plain"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 navigate(`/app/ticket/${id}`);
//               }}
//             >
//               View
//             </Button>

//             {/* Delete Button */}
//             <Tooltip content="Delete Ticket">
//               <Button
//                 icon={DeleteIcon}
//                 tone="critical"
//                 variant="plain"
//                 size="slim"
//                 onClick={(e) => {
//                   e.stopPropagation(); // Row click hone se roko

//                   // Browser ka default confirm box
//                   if (confirm("Are you sure you want to delete this ticket?")) {
//                     // Backend ko delete request bhejo
//                     fetcher.submit({ id }, { method: "DELETE" });
//                   }
//                 }}
//               />
//             </Tooltip>
//           </InlineStack>
//         </IndexTable.Cell>
//       </IndexTable.Row>
//     )
//   );

//   return (
//     <Page fullWidth>
//       <Layout>
//         <Layout.Section>
//           <Card padding="0">
//             <Box padding="400" borderBlockEndWidth="025" borderColor="border">
//               <InlineStack align="space-between" blockAlign="center">
//                 <Text variant="headingLg" as="h1">Zendesk Ticket Generate</Text>
//                 <Button
//                   variant="primary"
//                   tone="success"
//                   onClick={() => navigate("/app/create")}
//                 >
//                   Create Ticket
//                 </Button>
//               </InlineStack>
//             </Box>

//             <IndexTable
//               resourceName={resourceName}
//               itemCount={tickets.length}
//               selectedItemsCount={
//                 allResourcesSelected ? "All" : selectedResources.length
//               }
//               onSelectionChange={handleSelectionChange}
//               headings={[
//                 { title: "No." },
//                 { title: "Inquiry" },
//                 { title: "Status" },
//                 { title: "Date" },
//                 { title: "Action" },
//               ]}
//             >
//               {rowMarkup}
//             </IndexTable>
//           </Card>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }
import { useLoaderData, useNavigate, useFetcher } from "react-router";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  useIndexResourceState,
  Text,
  Badge,
  Button,
  InlineStack,
  Box,
  Tooltip,
  Thumbnail,
  EmptyState
} from "@shopify/polaris";
import { DeleteIcon, EyeDropperIcon, EyeFirstIcon, ImageIcon, ViewIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// 1. LOADER: Ab Tickets nahi, 'GeneratedProduct' fetch karenge
export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // Database se wo products lao jo humne AI se banaye hain
  const products = await prisma.generatedProduct.findMany({
    orderBy: { createdAt: "desc" },
  });

  return { products };
};

// 2. ACTION: History delete karne ke liye
export const action = async ({ request }) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const productId = formData.get("id");

  if (productId) {
    await prisma.generatedProduct.delete({
      where: { id: parseInt(productId) },
    });
  }

  return { success: true };
};

export default function Index() {
  const { products } = useLoaderData();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const resourceName = {
    singular: "product",
    plural: "products",
  };

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(products);

  // 3. ROW MARKUP: Table ka design change (Image, Title, Status)
  const rowMarkup = products.map(
    ({ id, title, status, imageUrl, createdAt, shopifyId }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        {/* Column 1: Product Image */}
        <IndexTable.Cell>
          <Thumbnail
            source={imageUrl || ImageIcon}
            alt={title}
            size="small"
          />
        </IndexTable.Cell>

        {/* Column 2: Product Title */}
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {title}
          </Text>
        </IndexTable.Cell>

        {/* Column 3: Status */}
        <IndexTable.Cell>
          <Badge tone="success" progress="complete">
            {status}
          </Badge>
        </IndexTable.Cell>

        {/* Column 4: Created Date */}
        <IndexTable.Cell>
          {new Date(createdAt).toLocaleDateString("en-GB")}
        </IndexTable.Cell>

        {/* Column 5: Action (Delete) */}
        <IndexTable.Cell>
          <InlineStack gap="200" wrap={false}>
            {/* View on Shopify Button (Agar product ban chuka hai) */}
            {shopifyId && (
              <Button
                variant="plain"
                onClick={() => window.open(`shopify:admin/products/${shopifyId.split('/').pop()}`, '_blank')}
              >
                View in Admin
              </Button>
            )}

            <Tooltip content="Delete History">
              <Button
                icon={DeleteIcon}
                tone="critical"
                variant="plain"
                onClick={() => {
                  if (confirm("Remove this from history?")) {
                    fetcher.submit({ id }, { method: "DELETE" });
                  }
                }}
              />
            </Tooltip>
            <Tooltip content="View">
              <Button
                icon={ViewIcon}
                tone="success"
                variant="plain"
                onClick={() => navigate(`/app/ai-preview?id=${id}`)}
              />
            </Tooltip>
          </InlineStack>
        </IndexTable.Cell>
      </IndexTable.Row>
    )
  );

  // 4. MAIN UI
  return (
    <Page fullWidth>
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {/* Header: Title aur Generate Button */}
            <Box padding="400" borderBlockEndWidth="025" borderColor="border">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingLg" as="h1">AI Product Dashboard</Text>
                <Button
                  variant="primary"
                  tone="success" // Green Button
                  onClick={() => navigate("/app/ai")} // Redirects to AI Page
                >
                  Generate New Product
                </Button>
              </InlineStack>
            </Box>

            {/* Agar products hain to Table dikhao, nahi to Empty State */}
            {products.length > 0 ? (
              <IndexTable
                resourceName={resourceName}
                itemCount={products.length}
                selectedItemsCount={
                  allResourcesSelected ? "All" : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: "Image" },
                  { title: "Product Title" },
                  { title: "Status" },
                  { title: "Date Created" },
                  { title: "Action" },
                ]}
              >
                {rowMarkup}
              </IndexTable>
            ) : (
              <EmptyState
                heading="No AI Products Generated Yet"
                action={{
                  content: 'Generate Product',
                  onAction: () => navigate("/app/ai"),
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Use AI to create descriptions, images, and pricing in seconds.</p>
              </EmptyState>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}