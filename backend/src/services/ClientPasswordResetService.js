import prisma from "../config/prisma.js";
import Password from "../utils/Password.js";
import { resetClientPassword } from "./clientPasswordReset.js";
export default function reset(input) { return resetClientPassword(input, { db: prisma, hash: value => Password.hash(value) }); }
