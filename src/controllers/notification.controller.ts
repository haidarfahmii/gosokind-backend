import { Request, Response } from "express";

export const getNotifications = async (req: Request, res: Response) => {
  // Mock data - in future replace with DB call
  const mockNotifications = [
    {
      id: "1",
      title: "Welcome to Gosokind",
      message: "Your account has been successfully created.",
      createdAt: new Date().toISOString(),
      read: false,
    },
    {
      id: "2",
      title: "System Update",
      message: "Maintenance scheduled for Sunday 2 AM.",
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      read: true,
    }
  ];

  res.status(200).json({
    success: true,
    data: mockNotifications
  });
};
