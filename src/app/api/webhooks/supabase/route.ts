import { createUser, updateUser } from "@/lib/db";
import { hash } from "bcrypt";
=======
import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
