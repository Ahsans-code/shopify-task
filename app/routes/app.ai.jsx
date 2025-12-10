import { useState, useCallback } from "react";
import { useSubmit, useNavigation, useActionData, Form } from "react-router";
import {
    Page, Layout, Card, TextField, Button, BlockStack, Text, Banner, Box
} from "@shopify/polaris";
import { generateProductData, generateProductImage } from "../services/ai.server";
import { authenticate } from "../shopify.server";
import { redirect } from "react-router";
import prisma from "../db.server";

// BACKEND: Handle AI Generation
export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request); // Session bhi chahiye shop name ke liye
    const formData = await request.formData();
    const title = formData.get("title");

    if (!title) return { error: "Title is required" };

    try {
        // 1. Generate Data
        const productData = await generateProductData(title);

        // 2. Generate Image
        const imageUrl = await generateProductImage(productData.imagePrompt);
        console.log(productData, imageUrl, "output")
        // Full Object banalo
        const fullData = { ...productData, imageUrl };

        // 3. ✅ DATABASE MEIN SAVE KARO (URL mein nahi)
        const draftProduct = await prisma.generatedProduct.create({
            data: {
                shop: session.shop,
                title: productData.title,
                description: productData.descriptionHtml,
                imageUrl: imageUrl,
                status: "Draft", // Abhi Draft hai
                productJson: JSON.stringify(fullData) // Pura raw data yahan save karlo
            }
        });

        // 4. Sirf ID lekar redirect karo (No more URI Error)
        return redirect(`/app/ai-preview?id=${draftProduct.id}`);

    } catch (error) {
        console.error(error);
        return { error: "AI Generation Failed. Try again." };
    }
};

// FRONTEND
export default function AIGenerator() {
    const actionData = useActionData();
    const navigation = useNavigation();
    const submit = useSubmit();
    const [title, setTitle] = useState("");

    const isLoading = navigation.state === "submitting";

    const handleGenerate = useCallback(() => {
        submit({ title }, { method: "post" });
    }, [title, submit]);

    return (
        <Page title="AI Product Generator">
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="500">
                            <Text variant="headingMd" as="h2">Create a new product with AI</Text>
                            <Text as="p" tone="subdued">
                                Enter a simple product title (e.g., "Luxury Leather Backpack") and let AI do the rest.
                            </Text>

                            {actionData?.error && (
                                <Banner tone="critical">{actionData.error}</Banner>
                            )}

                            <Form method="post">
                                <BlockStack gap="400">
                                    <TextField
                                        label="Product Title"
                                        name="title"
                                        value={title}
                                        onChange={setTitle}
                                        autoComplete="off"
                                        placeholder="e.g. Organic Green Tea"
                                        disabled={isLoading}
                                    />
                                    <Button
                                        variant="primary"
                                        tone="success" // Green button
                                        onClick={handleGenerate}
                                        loading={isLoading}
                                        disabled={!title || isLoading}
                                    >
                                        {isLoading ? "Generating Magic..." : "Generate Product"}
                                    </Button>
                                </BlockStack>
                            </Form>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}