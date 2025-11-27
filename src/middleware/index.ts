import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

// Request validation middleware
export const validateRequest = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const validationErrors = error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationErrors
                });
            }

            next(error);
        }
    };
};

// Error handling middleware
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', error);

    if (error.code === '23505') {
        return res.status(400).json({
            success: false,
            message: 'Record already exists',
        });
    }

    if (error.message?.includes('Cloudinary')) {
        return res.status(400).json({
            success: false,
            message: 'File upload failed',
            error: error.message,
        });
    }

    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
};

// Not found middleware
export const notFound = (req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
};

// Simple rate limiting (in-memory - for production use Redis)
export const rateLimiter = () => {
    const requests = new Map();

    return (req: Request, res: Response, next: NextFunction) => {
        const ip = req.ip || 'unknown';
        const now = Date.now();
        const windowMs = 15 * 60 * 1000;
        const maxRequests = 100;

        if (!requests.has(ip)) {
            requests.set(ip, []);
        }

        const userRequests = requests.get(ip);
        const windowStart = now - windowMs;

        while (userRequests.length > 0 && userRequests[0] < windowStart) {
            userRequests.shift();
        }

        if (userRequests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later',
            });
        }

        userRequests.push(now);
        next();
    };
};