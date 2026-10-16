import { Op, Transaction } from "sequelize";
import { initializeDatabase, Lead, sequelize } from "@/lib/database";
import type { LeadInput } from "@/lib/lead-validation";

const duplicateWindowMs = 10 * 60 * 1000;

export class DuplicateLeadError extends Error {
  constructor() {
    super("A lead with this phone number was recently submitted.");
    this.name = "DuplicateLeadError";
  }
}

export async function createLead(
  input: LeadInput,
  referrer: string | null,
): Promise<number> {
  await initializeDatabase();

  return sequelize.transaction(
    { type: Transaction.TYPES.IMMEDIATE },
    async (transaction) => {
      const now = Date.now();
      const duplicate = await Lead.findOne({
        attributes: ["id"],
        where: {
          phone: input.phone,
          created_at: { [Op.gt]: now - duplicateWindowMs },
        },
        transaction,
      });

      if (duplicate) {
        throw new DuplicateLeadError();
      }

      const lead = await Lead.create(
        {
          ...input,
          referrer,
          created_at: now,
        },
        { transaction },
      );

      return lead.id;
    },
  );
}
