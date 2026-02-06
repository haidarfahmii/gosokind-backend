import { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';

const loginSchema = z.object({ email: z.string().email(), password: z.string() });

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const result = await authService.login(email, password);
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    
    // Zod Error handling (if not handled globally or if needed here explicitly)
    if (error instanceof z.ZodError) {
       res.status(400).json({ success: false, message: 'Validation Error', errors: error.issues });
       return;
    }

    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

