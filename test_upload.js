const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

// Test script to verify Supabase storage upload
async function testUpload() {
  console.log("Testing Supabase storage upload...");

  // Log environment variables
  console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log(
    "SERVICE ROLE KEY (first 8 chars):",
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8)
  );

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error("Missing environment variables!");
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Create a simple test file
    const testContent = "This is a test file for contract upload";
    const fileName = `test_contract_${Date.now()}.txt`;

    console.log("Attempting to upload:", fileName);

    const { data, error } = await supabase.storage
      .from("contracts")
      .upload(fileName, testContent, {
        contentType: "text/plain",
        upsert: true,
      });

    if (error) {
      console.error("Upload failed:", error);
    } else {
      console.log("Upload successful:", data);

      // Try to download the file to verify it was uploaded
      const { data: downloadData, error: downloadError } =
        await supabase.storage.from("contracts").download(fileName);

      if (downloadError) {
        console.error("Download failed:", downloadError);
      } else {
        console.log("Download successful, content:", await downloadData.text());
      }
    }
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testUpload();
