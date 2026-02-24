import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { MoreHorizontalIcon } from "lucide-react"
import { LogDetailsDialog } from "@/components/web/LogDetailsDialog"

export function LogsTable() {
    return (
        <Table dir="rtl" className=" **:text-right">
            <TableHeader>
                <TableRow>
                    <TableHead >نوع</TableHead>
                    <TableHead>دسته بندی</TableHead>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>توضیحات</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell className="font-medium">واریزی</TableCell>
                    <TableCell className="font-medium">سیب</TableCell>
                    <TableCell>$29.99</TableCell>
                    <TableCell className="font-medium">
                        <LogDetailsDialog />
                    </TableCell>
                    <TableCell className="text-left!">
                        <DropdownMenu dir="rtl">
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                    <MoreHorizontalIcon />
                                    <span className="sr-only">منو</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem >ویرایش</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" className="text-right">
                                    حذف
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    )
}
