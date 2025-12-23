import { Request, Response } from "express";

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const n8nWebhookUrl =
      process.env.VITE_N8N_GET_HEYREACH_CAMPAIGN_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      console.error("Campaign webhook URL not configured");
      return res.status(500).json({
        error: "Campaign webhook URL not configured",
      });
    }
    const response = await fetch(n8nWebhookUrl, {
      method: "GET",
    });

    if (!response.ok) {
      console.error(`n8n webhook returned status: ${response.status}`);
      return res.status(500).json({
        error: "Failed to fetch campaigns from n8n",
        message: `Webhook returned status: ${response.status}`,
      });
    }

    const text = await response.text();

    // Handle empty response
    if (!text || text.trim() === "") {
      console.warn("n8n webhook returned empty response");
      return res.json([]);
    }

    // Parse JSON response
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error(
        "Failed to parse n8n response as JSON:",
        text.substring(0, 100)
      );
      return res.status(500).json({
        error: "Invalid response from n8n webhook",
      });
    }

    // Normalize response to array format
    let campaigns: any[] = [];
    if (Array.isArray(data)) {
      campaigns = data;
    } else if (data.campaigns && Array.isArray(data.campaigns)) {
      campaigns = data.campaigns;
    } else if (data && typeof data === "object" && data.id && data.name) {
      // Single campaign object - wrap it in an array
      campaigns = [data];
    }

    res.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns from n8n:", error);
    res.status(500).json({
      error: "Failed to fetch campaigns",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
