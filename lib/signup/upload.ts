/* eslint-disable @typescript-eslint/no-explicit-any */
import { UseFormReturn } from "react-hook-form";
import { handleUploadSuccess } from "@/lib/actions";

export function uploadSignupImage(
  result: unknown,
  form: UseFormReturn<any>,
  setPreviewUrl: (url: string | null) => void,
  formField: string,
) {
  handleUploadSuccess(result, form, setPreviewUrl, formField);
}
