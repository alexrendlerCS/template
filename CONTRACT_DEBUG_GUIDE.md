# Contract Generation Debug Guide

## Overview

This guide helps identify the specific cause of "Failed to generate or send contract" errors, especially on mobile devices.

## Common Issues and Solutions

### 1. Environment Variables

**Symptoms**: Server configuration errors in logs
**Check**: Verify these environment variables are set:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`

### 2. Signature Issues (Mobile-Specific)

**Symptoms**: "Invalid signature format" or "Please provide a valid signature"
**Causes**:

- Touch events not captured properly
- Canvas resolution issues on mobile
- Base64 encoding problems

**Solutions**:

- Ensure user provides a complete signature (not just a dot)
- Check signature length is > 100 characters
- Verify signature contains actual drawing data

### 3. PDF Generation Failures

**Symptoms**: "Failed to process signature image"
**Causes**:

- Memory issues with large signature images
- Font embedding failures
- PDF-lib processing errors

**Solutions**:

- Reduce signature image quality if needed
- Check server memory limits
- Verify PDF-lib version compatibility

### 4. Supabase Storage Issues

**Symptoms**: "Failed to upload contract PDF"
**Causes**:

- Missing "contracts" bucket
- Insufficient permissions
- Network connectivity issues

**Solutions**:

- Create "contracts" bucket in Supabase
- Verify bucket permissions
- Check network connectivity

### 5. Email Sending Issues

**Symptoms**: Contract generated but email not sent
**Causes**:

- Invalid Resend API key
- Rate limiting
- Invalid email address

**Solutions**:

- Verify Resend API key is valid
- Check Resend account status
- Validate email address format

## Debugging Steps

### Step 1: Check Server Logs

Look for detailed error messages in the server logs. The enhanced logging will show:

- Environment variable status
- Request data validation
- PDF generation progress
- Storage upload status
- Email sending status

### Step 2: Test with Debug Endpoint

Visit `/api/debug/test-contract` to run a test contract generation with detailed logging.

### Step 3: Check Browser Console

On the client side, check the browser console for:

- Authentication errors
- Signature validation issues
- Network request failures

### Step 4: Mobile-Specific Checks

For mobile devices:

- Test signature capture on different devices
- Check touch event handling
- Verify canvas rendering
- Test with different screen sizes

## Quick Fixes

### For Mobile Signature Issues:

1. Clear browser cache and cookies
2. Try a different browser
3. Ensure device has good internet connection
4. Try signing with a stylus or finger

### For Server Issues:

1. Restart the application
2. Check environment variables
3. Verify Supabase bucket exists
4. Test Resend API key

### For Network Issues:

1. Check internet connection
2. Try on different network
3. Check if firewall is blocking requests
4. Verify DNS resolution

## Error Message Mapping

| Error Message                 | Likely Cause         | Solution                    |
| ----------------------------- | -------------------- | --------------------------- |
| "Server configuration error"  | Missing env vars     | Check environment variables |
| "Invalid signature format"    | Signature data issue | Re-sign the contract        |
| "Failed to process signature" | PDF generation issue | Check server resources      |
| "Failed to upload contract"   | Storage issue        | Verify Supabase bucket      |
| "Failed to save contract"     | Database issue       | Check database permissions  |
| "Failed to send email"        | Email service issue  | Verify Resend configuration |

## Prevention

1. **Regular Testing**: Test contract flow on different devices regularly
2. **Monitoring**: Set up alerts for contract generation failures
3. **Validation**: Add client-side validation before submission
4. **Fallbacks**: Implement retry mechanisms for failed operations
5. **Documentation**: Keep environment setup documentation updated
