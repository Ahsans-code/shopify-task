import { redirect, useActionData, useSubmit, Form, useNavigation } from "react-router";
import {
    Page,
    Layout,
    Card,
    TextField,
    Button,
    BlockStack,
    Text,
    Box
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }) => {
    await authenticate.admin(request);
    const formData = await request.formData();

    const title = formData.get("title");
    const description = formData.get("description");

    if (!title || !description) {
        return { error: "All fields are required" };
    }

    await prisma.ticket.create({
        data: {
            title,
            description,
            status: "Fulfilled", // Screenshot shows 'Fulfilled' or green badge
        },
    });

    return redirect("/app");
};

export default function CreateTicket() {
    const actionData = useActionData();
    const submit = useSubmit();
    const navigation = useNavigation();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const isLoading = navigation.state === "submitting";

    const handleSubmit = useCallback(() => {
        submit({ title, description }, { method: "post" });
    }, [title, description, submit]);

    return (
        <Page>
            <Layout>
                <Layout.Section>
                    {/* Header Text matches Screenshot */}
                    <Box paddingBlockEnd="400">
                        <Text variant="headingMd" as="h2" color="subdued">
                            Zendesk Ticket Generate / Create new ticket
                        </Text>
                    </Box>

                    <Card>
                        <Form method="post">
                            <BlockStack gap="500">
                                <TextField
                                    label="Title"
                                    name="title"
                                    value={title}
                                    onChange={(value) => setTitle(value)}
                                    autoComplete="off"
                                    error={actionData?.error}
                                    disabled={isLoading}
                                    placeholder=""
                                />

                                <TextField
                                    label="Description"
                                    name="description"
                                    value={description}
                                    onChange={(value) => setDescription(value)}
                                    multiline={6}
                                    autoComplete="off"
                                    disabled={isLoading}
                                    placeholder=""
                                />

                                {/* Green Submit Button aligned left */}
                                <div style={{ width: 'fit-content' }}>
                                    <Button
                                        submit
                                        variant="primary"
                                        tone="success"
                                        onClick={handleSubmit}
                                        loading={isLoading}
                                        disabled={isLoading}
                                    >
                                        Submit
                                    </Button>
                                </div>
                            </BlockStack>
                        </Form>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}