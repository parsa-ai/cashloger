import { LogsTable } from "@/components/web/LogsTable";

export default function LogsPage() {
    return (
        <>
            <section className="overflow-y-auto max-h-svh no-scrollbar">
                <LogsTable />
            </section>
        </>
    )
}
