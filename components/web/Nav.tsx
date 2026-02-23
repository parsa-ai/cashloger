import Link from "next/link"
import { ModeToggle } from "../ui/ModeToggle"
import { DateC } from "./DateC"

function Nav() {
  return (
    <nav className=" w-full flex gap-4 justify-between items-center p-4 border-b">
      <Link href="/">
        <h1 className="text-xl font-bold">کش لاگر</h1>
      </Link>
      <div className="w-max">
        <DateC />
      </div>
      <ModeToggle />
    </nav>
  )
}

export default Nav