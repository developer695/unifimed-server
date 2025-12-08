import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';
import { supabase } from '../config/supabase';
import { UploadResponse, } from '../types';

// 1. Generate Signed Upload URL
export const generateUploadUrl = async (req: Request, res: Response) => {
    try {
        const { filename, category, userId, userEmail, action } = req.body;

        // Validate required fields
        if (!filename || !category || !userId || !userEmail) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: filename, category, userId, userEmail'
            });
        }


        if (category === 'rules_upload_pdf') {
            if (action === 'clear') {

                try {
                    const { data: rulesFiles, error: filesFetchError } = await supabase
                        .from('pdf_uploads')
                        .select('id, cloudinary_public_id')
                        .eq('user_id', userId)
                        .eq('category', 'rules_upload_pdf');

                    if (filesFetchError) {
                        console.error('❌ Error fetching rules files:', filesFetchError);
                    } else if (rulesFiles && rulesFiles.length > 0) {
                        const cloudinaryDeletePromises = rulesFiles.map(async (file) => {
                            try {
                                await cloudinary.uploader.destroy(file.cloudinary_public_id, {
                                    resource_type: 'raw'
                                });
                                return true;
                            } catch (cloudinaryError) {
                                console.error(`❌ Failed to delete from Cloudinary: ${file.cloudinary_public_id}`, cloudinaryError);
                                return false;
                            }
                        });

                        await Promise.all(cloudinaryDeletePromises);

                        // Step 3: Delete all rules PDF records from pdf_uploads table
                        const { error: deleteFilesError } = await supabase
                            .from('pdf_uploads')
                            .delete()
                            .eq('user_id', userId)
                            .eq('category', 'rules_upload_pdf');

                        if (deleteFilesError) {
                            console.error('❌ Error deleting rules files from database:', deleteFilesError);
                        } else {
                            console.log(`🗑️ Deleted ${rulesFiles.length} rules PDF records from database`);
                        }
                    } else {
                        console.log('ℹ️ No existing rules PDF files found to delete');
                    }

                    // Step 4: Clear data from 'rules' table for this user
                    const { error: rulesError } = await supabase
                        .from('rules')
                        .delete()
                        .neq('id', 0);

                    if (rulesError) {
                        console.error('❌ Error clearing rules table:', rulesError);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to clear rules table',
                            error: rulesError.message
                        });
                    }

                    // Step 5: Clear data from 'rag_rules' table for this user
                    const { error: ragRulesError } = await supabase
                        .from('rag_rules')  // Add quotes around the table name
                        .delete()
                        .neq('id', 0);

                    if (ragRulesError) {
                        console.error('❌ Error clearing rag_rules table:', ragRulesError);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to clear rag_rules table',
                            error: ragRulesError.message
                        });
                    }
                } catch (clearError) {
                    console.error('❌ Error during rules clearing:', clearError);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to clear existing rules',
                        error: clearError instanceof Error ? clearError.message : String(clearError),
                    });
                }
            }
        }


        // Clean filename and create unique public_id with username
        const cleanEmail = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
        const originalName = filename.replace('.pdf', '').replace(/[^a-zA-Z0-9]/g, '_');
        const timestamp = Math.round(new Date().getTime() / 1000);

        // Create public_id with category and user info
        const publicId = `${category}/${cleanEmail}_${originalName}_${timestamp}`;


        // Parameters for signature - MUST be in alphabetical order!
        const params = {
            folder: 'pdf-uploads',
            public_id: publicId,
            timestamp: timestamp,
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET!,
        };


        // Generate signature - parameters must be in alphabetical order
        const signature = cloudinary.utils.api_sign_request(
            params,
            process.env.CLOUDINARY_API_SECRET!
        );


        const response = {
            success: true,
            message: 'Signed upload URL generated successfully',
            data: {
                cloudName: process.env.CLOUDINARY_CLOUD_NAME,
                apiKey: process.env.CLOUDINARY_API_KEY,
                timestamp: timestamp,
                signature: signature,
                upload_preset: 'unifimed-pdf-upload-signed',
                public_id: publicId,
                folder: 'pdf-uploads',
            },
        };


        res.json(response);
    } catch (error: any) {
        console.error('❌ [generateUploadUrl] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate signed upload URL',
            error: error.message,
        });
    }
};

// 2. Save File Record
export const saveFile = async (req: Request, res: Response) => {

    try {
        const {
            userId,
            category,
            original_filename,
            cloudinary_url,
            cloudinary_public_id,
            file_size
        } = req.body;

        // Validate required fields
        if (!userId || !category || !original_filename || !cloudinary_url || !cloudinary_public_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }


        // Save to Supabase pdf_uploads table
        const { data, error } = await supabase
            .from('pdf_uploads')
            .insert([
                {
                    user_id: userId,
                    category,
                    original_filename,
                    stored_filename: cloudinary_public_id,
                    cloudinary_url,
                    cloudinary_public_id,
                    file_size: file_size || 0,
                    mime_type: 'application/pdf',
                    upload_status: 'completed'
                }
            ])
            .select();

        if (error) {
            console.error('❌ [saveFile] Supabase error:', error);
            throw error;
        }


        const response: UploadResponse = {
            success: true,
            message: 'File record saved successfully',
            data: {
                id: data[0].id,
                stored_filename: data[0].stored_filename,
                cloudinary_url: data[0].cloudinary_url,
                category: data[0].category,
                upload_status: data[0].upload_status,
                created_at: data[0].created_at,
            },
        };

        res.status(201).json(response);
    } catch (error: any) {
        console.error('❌ [saveFile] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save file record',
            error: error.message,
        });
    }
};

// 3. Get Files with Filters
export const getFiles = async (req: Request, res: Response) => {

    try {
        const { userId, status, category } = req.query;

        // Validate required field
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }


        let query = supabase
            .from('pdf_uploads')
            .select('*')
            .eq('user_id', userId as string)
            .order('created_at', { ascending: false });

        // Add optional filters
        if (status) {
            query = query.eq('upload_status', status as string);
        }

        if (category) {
            query = query.eq('category', category as string);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ [getFiles] Supabase error:', error);
            throw error;
        }

        res.json({
            success: true,
            message: 'Files retrieved successfully',
            data: data || [],
        });
    } catch (error: any) {
        console.error('❌ [getFiles] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch files',
            error: error.message,
        });
    }
};

// 4. Delete File
export const deleteFile = async (req: Request, res: Response) => {

    try {
        const { id } = req.params;


        // First get the file record
        const { data: file, error: fetchError } = await supabase
            .from('pdf_uploads')
            .select('cloudinary_public_id')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error('❌ [deleteFile] Error fetching file:', fetchError);
            throw fetchError;
        }


        // Delete from Cloudinary
        await cloudinary.uploader.destroy(file.cloudinary_public_id, {
            resource_type: 'raw'
        });

        // Delete from Supabase
        const { error: deleteError } = await supabase
            .from('pdf_uploads')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('❌ [deleteFile] Supabase delete error:', deleteError);
            throw deleteError;
        }


        res.json({
            success: true,
            message: 'File deleted successfully',
        });
    } catch (error: any) {
        console.error('❌ [deleteFile] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete file',
            error: error.message,
        });
    }
};