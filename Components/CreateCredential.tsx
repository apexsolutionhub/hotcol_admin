"use client";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { credential, credentialForm } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "./ui/form";
import CustomFormField, { formFieldTypes } from "./customFormField";
import { useState } from "react";
import { handleCredential, handleUploadSuccess } from "@/lib/actions";
import { Button } from "@/Components/ui/button";
import { toast } from "sonner";

const CreateCredential = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<credential>({
    resolver: zodResolver(credentialForm),
    defaultValues: {
      HotelName: "",
      UserName: "",
      Password: "",
      LogoUrl: "",
      Role: "admin",
    },
  });

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Card>
        <CardHeader>
          <CardTitle>Credential Create</CardTitle>
          <CardDescription>
            Creating Credential of the Hotel Admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(async (values) => {
                try {
                  await handleCredential(values, setIsLoading);
                  form.reset();
                  setPreviewUrl(null); 
                  toast.success("Credential Created Successfully");
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Failed to create credential"
                  );
                }
              })}
              className="flex flex-col gap-5"
            >
              <div className="flex items-start gap-5">
                <CustomFormField
                  name="HotelName"
                  control={form.control}
                  fieldType={formFieldTypes.INPUT}
                  label="Hotel Name:"
                  placeholder="hotel name"
                  inputClassName="h-fit p-2"
                />
                <CustomFormField
                  name="LogoUrl"
                  control={form.control}
                  fieldType={formFieldTypes.IMAGE_UPLOADER}
                  label="Select Logo"
                  placeholder="enter your hotel logo"
                  previewUrl={previewUrl}
                  handleCloudinary={(result) =>
                    handleUploadSuccess(result, form, setPreviewUrl, "LogoUrl")
                  }
                />
              </div>
              <div className="flex items-center gap-5">
                <CustomFormField
                  name="UserName"
                  control={form.control}
                  fieldType={formFieldTypes.INPUT}
                  label="Username:"
                  placeholder="admin username"
                  inputClassName="h-fit p-2"
                />
                <CustomFormField
                  name="Password"
                  control={form.control}
                  fieldType={formFieldTypes.INPUT}
                  label="Admin Password:"
                  placeholder="admin password"
                  type="password"
                  inputClassName="h-fit p-2"
                />
              </div>
              <Button type="submit" className="cursor-pointer">
                {isLoading ? "Loading..." : "Submit"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCredential;
