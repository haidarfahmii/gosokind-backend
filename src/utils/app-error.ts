export type TAppError = Error & {
  statusCode: number;
  isOperational: boolean;
};

export function AppError(message: string, statusCode: number = 500) {
  const error = new Error(message) as Error & {
    statusCode: number;
    isOperational: boolean;
  };

  error.statusCode = statusCode;
  error.isOperational = true;

  return error;
}
