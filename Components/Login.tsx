"use client";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { login, loginSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "./ui/form";
import CustomFormField, { formFieldTypes } from "./customFormField";
import { Button } from "@/Components/ui/button";

const Login = () => {
  const form = useForm<login>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  return (
    <div className="flex flex-col gap-10 items-center h-screen justify-center">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Authenticate yourself</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="flex flex-col gap-5">
                <CustomFormField 
                name="username"
                control={form.control}
                fieldType={formFieldTypes.INPUT}
                label="Username:"
                placeholder="Enter valid username"
                className="h-fit p-2 w-56"
                />
                <CustomFormField 
                name="password"
                control={form.control}
                fieldType={formFieldTypes.INPUT}
                label="Password:"
                className="h-fit p-2 w-56"
                type="password"
                />
                <Button>Login</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
