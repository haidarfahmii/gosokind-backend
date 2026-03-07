import {
  getAllOutlets,
  getAllOutletsForDropdown,
  getOutletById,
} from "./outlet-query.service";

import {
  createOutlet,
  updateOutlet,
  deleteOutlet,
} from "./outlet-mutation.service";

import { calculateShipping } from "./outlet-shipping.service";
import { generateOutletCode } from "./outlet-code.service";

export const outletService = {
  getAllOutlets,
  getAllOutletsForDropdown,
  getOutletById,
  createOutlet,
  updateOutlet,
  deleteOutlet,
  calculateShipping,
  generateOutletCode,
};
