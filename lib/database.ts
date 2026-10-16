import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";
import type { LeadInterest } from "@/lib/lead-validation";

const databasePath = resolve(
  process.cwd(),
  process.env.SQLITE_PATH ?? "data/leads.sqlite",
);

const globalForDatabase = globalThis as typeof globalThis & {
  sequelize?: Sequelize;
  initialization?: Promise<void>;
  leadModel?: typeof LeadModel;
};

export const sequelize =
  globalForDatabase.sequelize ??
  new Sequelize({
    dialect: "sqlite",
    storage: databasePath,
    logging: false,
    pool: {
      max: 1,
      min: 0,
      acquire: 30_000,
      idle: 10_000,
    },
  });

globalForDatabase.sequelize = sequelize;

class LeadModel extends Model<
  InferAttributes<LeadModel>,
  InferCreationAttributes<LeadModel>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare phone: string;
  declare interest: LeadInterest;
  declare comment: string | null;
  declare utm_source: string | null;
  declare utm_medium: string | null;
  declare utm_campaign: string | null;
  declare utm_content: string | null;
  declare utm_term: string | null;
  declare gclid: string | null;
  declare page_url: string | null;
  declare referrer: string | null;
  declare created_at: CreationOptional<number>;
}

export const Lead =
  globalForDatabase.leadModel ??
  (globalForDatabase.leadModel = LeadModel);

if (!sequelize.isDefined("Lead")) {
  Lead.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(16),
        allowNull: false,
      },
      interest: {
        type: DataTypes.STRING(32),
        allowNull: false,
        validate: {
          isIn: [["subscription", "single_order", "question"]],
        },
      },
      comment: {
        type: DataTypes.STRING(1000),
        allowNull: true,
      },
      utm_source: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      utm_medium: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      utm_campaign: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      utm_content: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      utm_term: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      gclid: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      page_url: {
        type: DataTypes.STRING(2048),
        allowNull: true,
      },
      referrer: {
        type: DataTypes.STRING(2048),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Lead",
      tableName: "leads",
      timestamps: false,
      indexes: [
        {
          name: "leads_phone_created_at_idx",
          fields: ["phone", "created_at"],
        },
      ],
    },
  );
}

export function initializeDatabase(): Promise<void> {
  if (!globalForDatabase.initialization) {
    const initialization = Promise.resolve().then(async () => {
      mkdirSync(dirname(databasePath), { recursive: true });
      await sequelize.authenticate();
      await sequelize.sync();
    });

    globalForDatabase.initialization = initialization;
    void initialization.catch(() => {
      if (globalForDatabase.initialization === initialization) {
        globalForDatabase.initialization = undefined;
      }
    });
  }

  return globalForDatabase.initialization;
}

export async function checkDatabaseConnection(): Promise<void> {
  await initializeDatabase();
  await sequelize.authenticate();
}
