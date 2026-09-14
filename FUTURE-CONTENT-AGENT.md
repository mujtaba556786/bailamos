# Future feature: Bailamos Content Agent

Status: saved for future implementation  
Goal: let the restaurant owner provide a folder of approved photos, videos and notes, then receive reviewable updates for menu, events, social media and SEO.

## Recommended product experience

Add a sixth admin area named **Content Agent** with an Inbox and Review Queue.

1. The owner uploads a folder or drops files into an approved synced folder.
2. The system checks file type, size, duplicates and malware status.
3. AI reads filenames, images and supplied notes. For video, it analyzes selected frames and an audio transcript rather than sending the entire raw video to a text model.
4. AI classifies each asset as menu, event, gallery, Instagram/TikTok draft, or unrelated.
5. It creates drafts: titles, descriptions, alt text, captions, hashtags, SEO metadata and suggested placement.
6. The owner compares the original content with the proposal.
7. The owner can approve individual fields, edit them, reject them, or approve the whole batch.
8. Only an explicit **Publish approved changes** action updates the public website.
9. Every publication stores an audit record and supports rollback.

## Folder options

### Recommended: Admin Inbox

The owner uploads a folder through the existing admin dashboard. Files are stored in the website’s private object storage until approved. This works from phone, tablet and desktop and does not require a restaurant computer to remain online.

### Optional: approved desktop folder

A small desktop sync utility watches one folder selected by the owner and uploads only new files. The website itself cannot and should not access arbitrary folders on a private computer.

Suggested structure:

```text
Bailamos Inbox/
  menu/
  events/
  gallery/
  social/
  notes.txt
```

Folders are hints, not automatic permission to publish.

## Owner controls

- Draft-only AI by default
- Separate approve and publish permissions
- Before/after preview for every field and image
- Never change prices, allergens, availability, dates or opening hours without confirmation
- Never post directly to Instagram or TikTok without a connected account and explicit approval
- Batch limits and a visible estimated cost before each run
- Per-run usage and cost history
- Duplicate detection using file hashes
- Rejected assets remain unpublished
- Complete audit history and rollback

## Image and video handling

The agent can:

- Check resolution, aspect ratio, blur, lighting and likely cropping problems
- Suggest the strongest hero/gallery image
- Create descriptive alt text
- Produce web-sized derivatives while preserving the original
- Suggest Instagram portrait, story and website crops
- Extract representative video frames
- Transcribe speech and suggest captions
- Flag low-quality media

It should not automatically “improve” or regenerate food photographs. Any generative edit must be clearly labeled and separately approved so the website does not misrepresent actual dishes.

## Cost estimate per run

API cost depends on the chosen model, token volume, number and resolution of images, video duration, and whether image generation/editing is requested.

Recommended economical model for classification and drafting: a cost-sensitive multimodal model such as GPT-5.6 Luna. Current official list pricing is $0.20 per million input tokens and $1.20 per million output tokens. All current general models accept text and image input.

Planning estimates, not fixed prices:

| Example run | Estimated API cost |
| --- | ---: |
| One menu/event text update | under $0.01 |
| 10–20 photos analyzed with captions and alt text | about $0.01–$0.10 |
| Short video sampled into frames plus transcript | about $0.05–$0.50 |
| Typical mixed weekly batch | about $0.10–$1.00 |
| Generating/editing images or processing long videos | quoted separately; potentially several dollars |

The dashboard should calculate a pre-run estimate and enforce a configurable monthly spending limit. Hosting, object storage, email and social-platform fees are separate from AI API usage.

## Suggested implementation phases

### Phase 1 — safe drafts

- Folder upload to private Inbox
- Photo analysis and content classification
- Menu, event, gallery and SEO drafts
- Review, approve, publish and audit log
- Usage/cost display

### Phase 2 — media workflow

- Image-quality scoring and crop suggestions
- Web image derivatives
- Video frame sampling and transcription
- Social caption/story drafts

### Phase 3 — external publishing

- Instagram/Facebook connection through official APIs
- TikTok connection through official APIs
- Scheduled posts
- Approval roles and publication history

External social publishing depends on platform account eligibility, permissions and API review; it must not be assumed available until verified.

## Inputs required before development

- Preferred upload method: Admin Inbox or desktop folder sync
- Monthly AI spending limit
- Social accounts and desired approval rules
- Whether AI may crop/resize originals or only suggest changes
- Supported video length and maximum batch size
- Retention period for rejected/private media
