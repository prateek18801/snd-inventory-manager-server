import { CronJob } from "cron";
import Product from "../models/product";
import Transaction from "../models/transaction";

const drrUpdateJob = CronJob.from({
    cronTime: "0 30 23 * * *",
    onTick: async () => {
        try {
            console.log("✅ job started - drrUpdateJob");
            const transactions = await Transaction.find({
                created_at: {
                    $gte: `${new Date(new Date().setDate(new Date().getDate() - 2)).toLocaleDateString("fr-CA")}T00:00:00.000+05:30`,
                    $lte: `${new Date().toLocaleDateString("fr-CA")}T23:59:59.999+05:30`
                },
                action: "STOCK_OUT",
                reason: "picklist"
            }).lean();
            const frequency: Record<string, number> = {};
            for (const transaction of transactions) {
                if (!(transaction.product.toString() in frequency)) {
                    frequency[transaction.product.toString()] = transaction.quantity;
                    continue;
                }
                frequency[transaction.product.toString()] += transaction.quantity;
            }

            const products = await Product.find({});
            const updates = [];
            for (const product of products) {
                if (!(product._id.toString() in frequency)) product.drr = 0;
                else product.drr = +(frequency[product._id.toString()] / 3).toFixed(1)
                updates.push(product.save());
            }
            await Promise.all(updates);
            console.log("✅ job executed - drrUpdateJob");
        } catch (err) {
            console.error("❌ job failed - drrUpdateJob", err);
        }
    },
    start: false,
    timeZone: "Asia/Calcutta"
});

export {
    drrUpdateJob
}
