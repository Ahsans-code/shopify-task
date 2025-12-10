import { useLoaderData, useSubmit, useNavigation, redirect } from "react-router";
import {
    Page, Layout, Card, TextField, Button, BlockStack,
    Text, Divider, Box
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
    await authenticate.admin(request);
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) return redirect("/app/ai");

    const product = await prisma.generatedProduct.findUnique({
        where: { id: parseInt(id) }
    });

    if (!product || !product.productJson) {
        return redirect("/app/ai");
    }

    return {
        productData: JSON.parse(product.productJson),
        dbId: product.id
    };
};

export const action = async ({ request }) => {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();

    const productJson = JSON.parse(formData.get("productJson"));
    const dbId = formData.get("dbId");

    const optionName = "Option";
    console.log("product json", productJson)
    const response = await admin.graphql(
        `#graphql
    mutation CreateProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
      productCreate(product: $product, media: $media) {
         product {
      id
      title
    }
    userErrors {
      field
      message
    }
      }
    }
      
    `,
        {
            variables: {
                product: {
                    title: productJson.title,
                    descriptionHtml: productJson.descriptionHtml,
                    productType: "AI Generated",
                    status: "ACTIVE",
                    tags: productJson.tags,
                    productOptions: [
                        {
                            name: optionName,
                            values: productJson.variants.map((v) => ({ name: v.name }))
                        }
                    ]
                },
                media: [
                    {
                        originalSource: productJson.imageUrl,
                        mediaContentType: "IMAGE"
                    }
                ]
            },
        }
    );

    const responseJson = await response.json();

    if (responseJson.data.productCreate.userErrors.length > 0) {
        console.error("Shopify API Error:", responseJson.data.productCreate.userErrors);
        return { error: responseJson.data.productCreate.userErrors[0].message };
    }

    const newShopifyId = responseJson.data.productCreate.product.id;

    await prisma.generatedProduct.update({
        where: { id: parseInt(dbId) },
        data: {
            status: "Published",
            shopifyId: newShopifyId,
            title: productJson.title,
            description: productJson.descriptionHtml.substring(0, 100) + "..."
        }
    });

    return redirect("/app?success=true");
};



export default function AIPreview() {
    const { productData, dbId } = useLoaderData();
    const submit = useSubmit();
    const navigation = useNavigation();
    const isSaving = navigation.state === "submitting";

    const [title, setTitle] = useState(productData.title);
    const [desc, setDesc] = useState(productData.descriptionHtml);
    const [price, setPrice] = useState(productData.price);

    const handlePublish = () => {
        const finalData = {
            ...productData,
            title,
            descriptionHtml: desc,
            variants: productData.variants.map(v => ({ ...v, price: price }))
        };

        submit({
            productJson: JSON.stringify(finalData),
            dbId: dbId
        }, { method: "post" });
    };

    return (
        <Page title="Preview AI Product" backAction={{ content: "Back", url: "/app/ai" }}>
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Review Details</Text>
                            <TextField label="Product Title" value={title} onChange={setTitle} autoComplete="off" />
                            <TextField label="Description (HTML)" value={desc} onChange={setDesc} multiline={6} autoComplete="off" />
                            <TextField label="Base Price" value={price} onChange={setPrice} type="number" prefix="$" autoComplete="off" />

                            <Box paddingBlockStart="200">
                                <Text variant="headingSm">AI Generated Variants:</Text>
                                <ul>
                                    {productData.variants.map((v, i) => (
                                        <li key={i}>{v.name} - ${v.price}</li>
                                    ))}
                                </ul>
                            </Box>
                        </BlockStack>
                    </Card>
                </Layout.Section>

                <Layout.Section variant="oneThird">
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd">AI Image</Text>
                            <img src={productData.imageUrl} alt="AI Generated" style={{ width: "100%", borderRadius: "8px" }} />
                            <Divider />
                            <Button variant="primary" tone="success" fullWidth onClick={handlePublish} loading={isSaving}>
                                Publish to Shopify
                            </Button>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}