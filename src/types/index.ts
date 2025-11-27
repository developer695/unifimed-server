export type PdfCategory =
    | 'contact_enrichment_pdf'
    | 'keyword_research_pdf'
    | 'rules_upload_pdf';

export interface UploadResponse {
    success: boolean;
    message: string;
    data?: {
        id: string;
        stored_filename: string;
        cloudinary_url: string;
        category: PdfCategory;
        upload_status: string;
        created_at: string;
    };
    error?: string;
}

export interface PdfUploadRecord {
    id?: string;
    user_id: string;
    category: PdfCategory;
    original_filename: string;
    stored_filename: string;
    cloudinary_url: string;
    cloudinary_public_id: string;
    file_size: number;
    mime_type: string;
    upload_status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at?: string;
    updated_at?: string;
}

export interface SignedUploadData {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    signature: string;
    upload_preset: string;
    public_id: string;
    folder: string;
    resource_type: string;
}

export interface GenerateSignedUrlRequest {
    filename: string;
    category: PdfCategory;
    userId: string;
    userEmail: string;
}   