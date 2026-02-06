import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import { signToken } from '../lib/auth';

export const login = async (email: string, password: string) => {
  const user = await findUser(email);

  if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const token = signToken({ userId: user.id, role: user.role, outletId: user.outletId });
  
  return { 
    token, 
    user: stripPassword(user) 
  };
};

// --- PRIVATE HELPERS ---

const findUser = async (email: string) => {
  const emp = await prisma.employee.findUnique({ where: { email } });
  if (emp) return { ...emp, role: emp.role, outletId: emp.outletId };

  const cust = await prisma.customer.findUnique({ where: { email } });
  if (cust) return { ...cust, role: 'CUSTOMER', outletId: null };

  return null;
};

const stripPassword = (user: any) => {
  const { password, ...rest } = user;
  return rest;
};
