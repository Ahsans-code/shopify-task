import { useLoaderData, useNavigation, Form, redirect } from "react-router";
import {
    Page,
    Layout,
    Card,
    Text,
    BlockStack,
    TextField,
    Button,
    InlineStack,
    Box
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ params, request }) => {
    await authenticate.admin(request);
    const ticket = await prisma.ticket.findUnique({
        where: { id: parseInt(params.id) },
    });

    if (!ticket) {
        throw new Response("Not Found", { status: 404 });
    }

    return { ticket };
};

export const action = async ({ request, params }) => {
    await authenticate.admin(request);

    if (request.method === "DELETE") {
        await prisma.ticket.delete({
            where: { id: parseInt(params.id) }
        });
        return redirect("/app");
    }

    return null;
};

export default function TicketDetail() {
    const { ticket } = useLoaderData();
    const navigation = useNavigation();

    const isDeleting = navigation.state === "submitting" && navigation.formMethod === "delete";

    return (
        <Page>
            <Layout>
                <Layout.Section>
                    {/* Header Text matches Screenshot */}
                    <Box paddingBlockEnd="400">
                        <Text variant="headingMd" as="h2" color="subdued">
                            Zendesk Ticket Generator
                        </Text>
                        <Text variant="headingLg" as="h1">
                            Zendesk Ticket Generate / Create new ticket
                        </Text>
                    </Box>

                    <Card>
                        <BlockStack gap="400">
                            <TextField
                                label="Title"
                                value={ticket.title}
                                readOnly
                                autoComplete="off"
                            />

                            <TextField
                                label="Description"
                                value={ticket.description}
                                readOnly
                                multiline={6}
                                autoComplete="off"
                            />

                            <InlineStack align="space-between" blockAlign="center">


                                <Form method="delete">
                                    <Button
                                        submit
                                        tone="critical"
                                        variant="plain"
                                        loading={isDeleting}
                                        disabled={isDeleting}
                                    >
                                        Delete Ticket
                                    </Button>
                                </Form>
                            </InlineStack>

                            <Text variant="bodySm" as="p" color="subdued" alignment="end">
                                Activate Windows<br />Go to Settings to activate Windows.
                            </Text>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}