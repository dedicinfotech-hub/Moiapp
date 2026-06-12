from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

pdf = SimpleDocTemplate("MoiApp_Cloud_Scalability_Report.pdf", pagesize=A4,
                        rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)

styles = getSampleStyleSheet()
title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=22, textColor=colors.HexColor('#1a73e8'), spaceAfter=20, alignment=TA_CENTER)
h1 = ParagraphStyle('H1', parent=styles['Heading1'], fontSize=16, textColor=colors.HexColor('#1a73e8'), spaceAfter=10, spaceBefore=10)
h2 = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=13, textColor=colors.HexColor('#34a853'), spaceAfter=8, spaceBefore=8)
body = ParagraphStyle('Body', parent=styles['BodyText'], fontSize=10, leading=14, alignment=TA_JUSTIFY)
mono = ParagraphStyle('Mono', parent=styles['Code'], fontSize=9, leading=12, textColor=colors.HexColor('#d93025'))
green = ParagraphStyle('Green', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#188038'))
blue = ParagraphStyle('Blue', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#1a73e8'))

story = []

# Title
story.append(Paragraph("MoiApp — Cloud Scalability & Load Testing Report", title_style))
story.append(Paragraph("Architecture Review · DigitalOcean Deployment · Performance Testing Guide", body))
story.append(Spacer(1, 0.2*inch))
story.append(Table([['']], colWidths=[6.5*inch], rowHeights=[2], style=TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#1a73e8'))])))
story.append(Spacer(1, 0.2*inch))

# Section 1
story.append(Paragraph("1. Current Architecture Overview", h1))
story.append(Paragraph("MoiApp is built on a <b>Next.js 14 static frontend</b> + <b>PHP 8+ REST API</b> + <b>MySQL 8.0</b> stack. The frontend is statically exported (SSG) and served as flat HTML/CSS/JS files, making it extremely CDN-friendly. The PHP backend handles authentication, CRUD operations, file uploads, PDF generation, and bulk imports.", body))
story.append(Spacer(1, 0.1*inch))

arch_data = [
    [Paragraph("<b>Layer</b>", body), Paragraph("<b>Technology</b>", body), Paragraph("<b>Role</b>", body)],
    ["Frontend", "Next.js 14 (Static Export)", "Serves event pages, dashboard, public client"],
    ["API Backend", "PHP 8+ (mysqli/PDO)", "REST endpoints for events, moi, photos, auth"],
    ["Database", "MySQL 8.0", "Stores users, events, moi_entries, photos, organizers"],
    ["File Storage", "Local disk (uploads/)", "Cover photos, event photos (currently local)"],
    ["Auth", "JWT / Session tokens", "User authentication & authorization"],
]
arch_table = Table(arch_data, colWidths=[1.5*inch, 2.2*inch, 2.8*inch])
arch_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1a73e8')),
    ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE', (0,0), (-1,0), 10),
    ('BOTTOMPADDING', (0,0), (-1,0), 8),
    ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8f9fa')),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
]))
story.append(arch_table)
story.append(Spacer(1, 0.15*inch))

# Section 2
story.append(Paragraph("2. Current Flow (How Requests Are Handled)", h1))
story.append(Paragraph("Below is the request lifecycle for the two most critical user paths:", body))
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("2.1 Public Guest — Viewing an Event & Adding Moi Entry", h2))
flow1 = [
    [Paragraph("<b>Step</b>", body), Paragraph("<b>Component</b>", body), Paragraph("<b>Action</b>", body)],
    ["1", "Browser / CDN", "User visits https://dsitesai.com/moiapp/e/wedding-slug"],
    ["2", "Nginx / Apache", "Serves static index.html or event.html from Next.js out/"],
    ["3", "Next.js Static", "Loads EventPublicClient.tsx (React hydrates)"],
    ["4", "API Call", "GET /api/events.php?slug=wedding-slug → returns event details"],
    ["5", "API Call", "GET /api/moi.php?event_id=123 → returns moi entries + breakdown"],
    ["6", "User Action", "Guest fills form → POST /api/moi.php (no auth, slug-based)"],
    ["7", "PHP Backend", "Validates input, inserts into moi_entries, returns success"],
    ["8", "Frontend", "React updates UI with new entry (optimistic or refetch)"],
]
flow_table = Table(flow1, colWidths=[0.6*inch, 1.8*inch, 4.1*inch])
flow_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#34a853')),
    ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE', (0,0), (-1,0), 10),
    ('BOTTOMPADDING', (0,0), (-1,0), 8),
    ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8f9fa')),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
]))
story.append(flow_table)
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("2.2 Admin — Creating Event & Managing Dashboard", h2))
flow2 = [
    [Paragraph("<b>Step</b>", body), Paragraph("<b>Component</b>", body), Paragraph("<b>Action</b>", body)],
    ["1", "Browser", "Admin logs in at /login → POST /api/auth.php?action=login"],
    ["2", "PHP Auth", "Validates credentials, returns JWT/session token"],
    ["3", "Frontend", "Stores token, redirects to /dashboard"],
    ["4", "Dashboard", "Fetches ModuleEvents, ModuleAnalytics, ModuleMoi data"],
    ["5", "API Calls", "Multiple parallel GET /api/events.php, /api/moi.php, /api/organizers.php"],
    ["6", "Admin Action", "Creates event → POST /api/events.php (with auth header)"],
    ["7", "PHP Backend", "Validates token, inserts event, generates slug, returns event"],
    ["8", "Frontend", "Updates dashboard, navigates to event editor"],
]
flow_table2 = Table(flow2, colWidths=[0.6*inch, 1.8*inch, 4.1*inch])
flow_table2.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#34a853')),
    ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE', (0,0), (-1,0), 10),
    ('BOTTOMPADDING', (0,0), (-1,0), 8),
    ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8f9fa')),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
]))
story.append(flow_table2)
story.append(Spacer(1, 0.15*inch))

# Section 3
story.append(Paragraph("3. Current Capacity Analysis", h1))
story.append(Paragraph("Based on code review of the PHP API endpoints and database schema:", body))
story.append(Spacer(1, 0.1*inch))

cap_data = [
    [Paragraph("<b>Endpoint</b>", body), Paragraph("<b>Operation</b>", body), Paragraph("<b>Complexity</b>", body), Paragraph("<b>Bottleneck</b>", body)],
    ["GET /api/events.php?public=1", "List all active events", "Medium — subquery COUNT/SUM per row", "N+1 query pattern on moi_entries"],
    ["GET /api/events.php?slug=X", "Single event detail", "Low — indexed slug lookup", "Minimal (fast with index)"],
    ["GET /api/moi.php?event_id=X", "List moi entries + breakdown", "Medium — GROUP BY relation, payment_mode", "Full table scan if no index"],
    ["POST /api/moi.php", "Add moi entry", "Low — single INSERT", "Minimal"],
    ["POST /api/events.php?action=cover", "Upload cover photo", "Medium — file I/O + INSERT", "Disk I/O, file validation"],
    ["GET /api/photos.php", "List event photos", "Low — simple SELECT", "Minimal with index"],
    ["POST /api/bulk-import.php", "Bulk import moi entries", "High — loops + multiple INSERTs", "Transaction time, memory"],
    ["GET /api/pdf.php", "Generate PDF report", "High — DOM parsing + PDF lib", "CPU + memory intensive"],
]
cap_table = Table(cap_data, colWidths=[1.6*inch, 1.4*inch, 1.4*inch, 2.1*inch])
cap_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f9ab00')),
    ('TEXTCOLOR', (0,0), (-1,0), colors.black),
    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE', (0,0), (-1,0), 9),
    ('BOTTOMPADDING', (0,0), (-1,0), 8),
    ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8f9fa')),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 5),
    ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
]))
story.append(cap_table)
story.append(Spacer(1, 0.15*inch))

story.append(Paragraph("Key Finding: The public event listing uses subqueries (COUNT/SUM on moi_entries) for every row. With 10,000 events, this becomes slow. The moi_entries table lacks composite indexes on (event_id, created_at).", body))
story.append(Spacer(1, 0.1*inch))

# Section 4
story.append(Paragraph("4. DigitalOcean Deployment Architecture", h1))
story.append(Paragraph("Two recommended approaches depending on your traffic expectations and budget:", body))
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("4.1 Option A: Droplet (VPS) — Best for 0–10K Daily Users", h2))
story.append(Paragraph("A single managed VPS gives you full control and predictable costs. Recommended starting spec:", body))
story.append(Spacer(1, 0.05*inch))

do_data = [
    [Paragraph("<b>Component</b>", body), Paragraph("<b>Spec</b>", body), Paragraph("<b>Monthly Cost</b>", body)],
    ["Droplet", "2 CPU, 2GB RAM, 50GB SSD (Ubuntu 22.04)", "$18"],
    ["Managed MySQL", "1 CPU, 1GB RAM, 10GB storage", "$15"],
    ["Spaces (Files)", "250GB storage + 1TB outbound", "$5"],
    ["Total", "", "<b>$38/month</b>"],
]
do_table = Table(do_data, colWidths=[2.2*inch, 2.8*inch, 1.5*inch])
do_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0069ff')),
    ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE', (0,0), (-1,0), 10),
    ('BOTTOMPADDING', (0,0), (-1,0), 8),
    ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8f9fa')),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
]))
story.append(do_table)
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("Droplet Architecture Diagram:", h2))
story.append(Paragraph("""
<b>Internet</b> → <b>Cloudflare (DNS + CDN)</b> → <b>Nginx</b> on Droplet
                                    ├── Static files (Next.js out/) → served directly
                                    ├── /api/* → PHP-FPM → MySQL (Managed)
                                    └── /uploads/* → Nginx (or proxy to Spaces)
""", mono))
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("4.2 Option B: App Platform — Best for 10K–100K Daily Users", h2))
story.append(Paragraph("Fully managed, auto-scaling, less ops overhead:", body))
story.append(Spacer(1, 0.05*inch))

app_data = [
    [Paragraph("<b>Component</b>", body), Paragraph("<b>Spec</b>", body), Paragraph("<b>Monthly Cost</b>", body)],
    ["Frontend (Static)", "Auto-scaling, CDN included", "$0–$5"],
    ["Backend (Web Service)", "1 CPU, 512MB → scales to 2 CPU, 1GB", "$12–$24"],
    ["Managed MySQL", "1 CPU, 1GB RAM (Basic)", "$15"],
    ["Managed Redis", "256MB (optional, for caching)", "$10"],
    ["Spaces (Files)", "250GB + 1TB out", "$5"],
    ["Total (min)", "", "<b>$32/month</b>"],
    ["Total (with Redis)", "", "<b>$42/month</b>"],
]
app_table = Table(app_data, colWidths=[2.2*inch, 2.8*inch, 1.5*inch])
app_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0069ff')),
    ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE', (0,0), (-1,0), 10),
    ('BOTTOMPADDING', (0,0), (-1,0), 8),
    ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8f9fa')),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
]))
story.append(app_table)
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("App Platform Architecture:", h2))
story.append(Paragraph("""
<b>Internet</b> → <b>App Platform Load Balancer</b>
                                    ├── Frontend Component (static, CDN)
                                    ├── Backend Component (PHP, auto-scaling)
                                    └── Managed MySQL (private network)
""", mono))
story.append(Spacer(1, 0.15*inch))

# Section 5
story.append(Paragraph("5. Load Testing Guide", h1))
story.append(Paragraph("Use <b>k6</b> (open-source, by Grafana) to test your DO deployment. Install it locally:", body))
story.append(Spacer(1, 0.05*inch))
story.append(Paragraph("<b>macOS:</b> <font color='#d93025'>brew install k6</font>", mono))
story.append(Paragraph("<b>Linux:</b> <font color='#d93025'>sudo apt install k6</font>", mono))
story.append(Paragraph("<b>Windows:</b> <font color='#d93025'>choco install k6</font>", mono))
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("5.1 Test Script: Public Event Browsing (Most Common Path)", h2))
story.append(Paragraph("Create <b>load-test.js</b>:", body))
story.append(Spacer(1, 0.05*inch))
story.append(Paragraph("""
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 50 },     // Hold 50 users
    { duration: '30s', target: 200 },   // Spike to 200
    { duration: '2m', target: 200 },    // Hold spike
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% under 500ms
    http_req_failed: ['rate<0.01'],                    // <1% errors
  },
};

export default function () {
  // Test 1: Public event listing
  let res = http.get(`${__ENV.BASE_URL}/api/events.php?public=1`);
  check(res, {
    'events status 200': (r) => r.status === 200,
    'events has data': (r) => r.json().length >= 0,
  });

  sleep(1);

  // Test 2: Single event page
  res = http.get(`${__ENV.BASE_URL}/api/events.php?slug=test-wedding`);
  check(res, {
    'event status 200': (r) => r.status === 200,
  });

  sleep(1);

  // Test 3: Moi entries for event
  res = http.get(`${__ENV.BASE_URL}/api/moi.php?event_id=1`);
  check(res, {
    'moi status 200': (r) => r.status === 200,
  });

  sleep(2);
}
""", mono))
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("5.2 Run the Test", h2))
story.append(Paragraph("""
# Test against your DO droplet
k6 run -e BASE_URL=https://your-domain.com load-test.js

# Test against local MAMP first
k6 run -e BASE_URL=http://localhost:8888/MoiApp load-test.js

# More aggressive test (500 concurrent)
k6 run -e BASE_URL=https://your-domain.com --vus 500 --duration 5m load-test.js
""", mono))
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("5.3 Interpreting Results", h2))
story.append(Paragraph("""
<b>Good (passes thresholds):</b>
  - p95 response time < 500ms
  - p99 response time < 1s
  - Error rate < 1%
  - No memory leaks (stable RAM usage)

<b>Needs optimization:</b>
  - p95 > 1s → add indexes, enable OPcache, add Redis cache
  - Error rate > 1% → check PHP-FPM max_children, MySQL connections
  - High CPU → optimize queries, consider read replicas
""", body))
story.append(Spacer(1, 0.15*inch))

# Section 6
story.append(Paragraph("6. Critical Optimizations Before Scaling", h1))
story.append(Paragraph("These changes have the highest impact on performance:", body))
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("6.1 Database Indexes (CRITICAL)", h2))
story.append(Paragraph("Run these SQL commands on your DO Managed MySQL:", body))
story.append(Spacer(1, 0.05*inch))
story.append(Paragraph("""
-- Composite index for moi entries (most queried)
CREATE INDEX idx_moi_event_created ON moi_entries(event_id, created_at DESC);

-- Event lookups
CREATE UNIQUE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_user_created ON events(user_id, created_at DESC);

-- Organizer lookups
CREATE UNIQUE INDEX idx_event_organizers ON event_organizers(event_id, user_id);

-- Photos
CREATE INDEX idx_photos_event ON photos(event_id, uploaded_at DESC);
""", mono))
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("6.2 PHP OPcache (HIGH IMPACT)", h2))
story.append(Paragraph("Edit <b>/etc/php/8.2/fpm/php.ini</b> on your Droplet:", body))
story.append(Spacer(1, 0.05*inch))
story.append(Paragraph("""
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=10000
opcache.validate_timestamps=0  ; set to 1 in dev, 0 in prod
""", mono))
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("6.3 Nginx Caching for Static Assets (MEDIUM)", h2))
story.append(Paragraph("Add to your Nginx config:", body))
story.append(Spacer(1, 0.05*inch))
story.append(Paragraph("""
location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \\.html$ {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}
""", mono))
story.append(Spacer(1, 0.1*inch))

story.append(Paragraph("6.4 Move File Uploads to DO Spaces (MEDIUM)", h2))
story.append(Paragraph("Replace local uploads/ with DO Spaces (S3-compatible). Update <b>config/s3.php</b>:", body))
story.append(Spacer(1, 0.05*inch))
story.append(Paragraph("""
// Use DO Spaces endpoint
$s3 = new Aws\\S3\\S3Client([
    'endpoint' => 'https://nyc3.digitaloceanspaces.com',
    'region' => 'nyc3',
    'version' => 'latest',
    'credentials' => [
        'key' => env('DO_SPACES_KEY'),
        'secret' => env('DO_SPACES_SECRET'),
    ],
]);
""", mono))
story.append(Spacer(1, 0.15*inch))

# Section 7
story.append(Paragraph("7. Monitoring on DigitalOcean", h1))
story.append(Paragraph("Set up these monitoring tools to track your app's health:", body))
story.append(Spacer(1, 0.1*inch))

mon_data = [
    [Paragraph("<b>Tool</b>", body), Paragraph("<b>What to Monitor</b>", body), Paragraph("<b>Alert Threshold</b>", body)],
    ["DO Monitoring", "CPU, Memory, Disk, Network", "CPU > 80%, Memory > 85%"],
    ["DO Managed MySQL", "Connections, QPS, Slow queries", "Connections > 80% max, Slow queries > 10/min"],
    ["Nginx access log", "Request rate, 4xx/5xx errors", "5xx rate > 1%"],
    ["k6 (scheduled)", "API response times", "p95 > 1s"],
    ["Uptime Robot (free)", "HTTP endpoint health", "Down for > 2 min"],
]
mon_table = Table(mon_data, colWidths=[1.5*inch, 2.5*inch, 2.5*inch])
mon_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0069ff')),
    ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE', (0,0), (-1,0), 10),
    ('BOTTOMPADDING', (0,0), (-1,0), 8),
    ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8f9fa')),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
]))
story.append(mon_table)
story.append(Spacer(1, 0.15*inch))

# Section 8
story.append(Paragraph("8. Scaling Path", h1))
story.append(Paragraph("How to grow your DO infrastructure as traffic increases:", body))
story.append(Spacer(1, 0.1*inch))

scale_data = [
    [Paragraph("<b>Traffic</b>", body), Paragraph("<b>Infrastructure</b>", body), Paragraph("<b>Monthly Cost</b>", body), Paragraph("<b>Action</b>", body)],
    ["0–5K users/day", "2 CPU Droplet + Managed MySQL", "$33", "Add indexes, OPcache"],
    ["5K–20K users/day", "4 CPU Droplet + Managed MySQL + Spaces", "$42", "Add Redis, enable Nginx cache"],
    ["20K–100K users/day", "App Platform (auto-scale) + Managed MySQL + Redis", "$52–$72", "Add Cloudflare in front"],
    ["100K+ users/day", "Kubernetes + RDS + Redis + CDN", "$200+", "Full microservices, read replicas"],
]
scale_table = Table(scale_data, colWidths=[1.3*inch, 2.2*inch, 1.2*inch, 1.8*inch])
scale_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1a73e8')),
    ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE', (0,0), (-1,0), 9),
    ('BOTTOMPADDING', (0,0), (-1,0), 8),
    ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8f9fa')),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 5),
    ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ('TOPPADDING', (0,0), (-1,-1), 5),
    ('BOTTOMPADDING', (0,0), (-1,-1), 5),
]))
story.append(scale_table)
story.append(Spacer(1, 0.15*inch))

# Section 9
story.append(Paragraph("9. Step-by-Step DO Deployment Checklist", h1))
story.append(Paragraph("Follow these steps to deploy MoiApp on DigitalOcean:", body))
story.append(Spacer(1, 0.1*inch))

checklist = [
    ["1", "Create DO account & add payment method"],
    ["2", "Create Managed MySQL database (Basic, 1 CPU, 1GB)"],
    ["3", "Create Spaces bucket for file uploads (region: nyc3)"],
    ["4", "Generate Spaces keys (Settings → API)"],
    ["5", "Create Droplet (Ubuntu 22.04, 2 CPU, 2GB, $18/mo)"],
    ["6", "SSH into Droplet, install Nginx, PHP 8.2-FPM, MySQL client"],
    ["7", "Upload code: frontend/out/ → /var/www/moiapp/, api/ config/ uploads/ → same"],
    ["8", "Configure Nginx virtual host (see Section 4.1)"],
    ["9", "Create config/.env with DO DB credentials + Spaces keys"],
    ["10", "Import database: mysql -u admin -p dbname < schema.sql"],
    ["11", "Run SQL indexes (Section 6.1)"],
    ["12", "Configure PHP OPcache (Section 6.2)"],
    ["13", "Set up Cloudflare DNS pointing to Droplet IP"],
    ["14", "Enable DO Monitoring + set alerts"],
    ["15", "Run k6 load test against live URL"],
    ["16", "Verify: https://your-domain.com, /api/auth.php?action=ping"],
]
for step, desc in checklist:
    story.append(Paragraph(f"<b>{step}.</b> {desc}", body))
    story.append(Spacer(1, 0.03*inch))

story.append(Spacer(1, 0.15*inch))

# Section 10
story.append(Paragraph("10. Cost Summary", h1))
story.append(Paragraph("Estimated monthly costs for different traffic tiers on DigitalOcean:", body))
story.append(Spacer(1, 0.1*inch))

cost_data = [
    [Paragraph("<b>Scenario</b>", body), Paragraph("<b>Setup</b>", body), Paragraph("<b>Monthly Cost</b>", body)],
    ["MVP / Testing", "Droplet + Managed MySQL", "$33"],
    ["Small Launch", "Droplet + Managed MySQL + Spaces + Redis", "$48"],
    ["Growing (10K users/day)", "App Platform + Managed MySQL + Redis + Spaces", "$52–$72"],
    ["Scale (50K+ users/day)", "App Platform (auto-scale) + RDS + Redis + CDN", "$150+"],
]
cost_table = Table(cost_data, colWidths=[1.8*inch, 2.8*inch, 1.9*inch])
cost_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1a73e8')),
    ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ('FONTSIZE', (0,0), (-1,0), 10),
    ('BOTTOMPADDING', (0,0), (-1,0), 8),
    ('BACKGROUND', (0,1), (-1,-1), colors.HexColor('#f8f9fa')),
    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 6),
    ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
]))
story.append(cost_table)
story.append(Spacer(1, 0.15*inch))

# Section 11
story.append(Paragraph("11. Quick Reference: DO Commands", h1))
story.append(Paragraph("Useful commands for managing your DO Droplet:", body))
story.append(Spacer(1, 0.05*inch))
story.append(Paragraph("""
# SSH into droplet
ssh root@your-droplet-ip

# Check PHP-FPM status
systemctl status php8.2-fpm

# Check Nginx status
systemctl status nginx

# View PHP error log
tail -f /var/log/php8.2-fpm.log

# View Nginx error log
tail -f /var/log/nginx/error.log

# Check MySQL connections
mysql -u admin -p -e "SHOW PROCESSLIST;"

# Check slow queries
mysql -u admin -p -e "SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;"

# Restart services after config changes
systemctl restart php8.2-fpm
systemctl restart nginx

# Check disk usage
df -h

# Check memory usage
free -h
""", mono))

story.append(Spacer(1, 0.2*inch))
story.append(Table([['']], colWidths=[6.5*inch], rowHeights=[2], style=TableStyle([('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#1a73e8'))])))
story.append(Spacer(1, 0.1*inch))
story.append(Paragraph("<i>Report generated for MoiApp project. For questions, refer to DEPLOY.md or contact the development team.</i>", ParagraphStyle('Footer', parent=body, fontSize=9, textColor=colors.grey, alignment=TA_CENTER)))

pdf.build(story)
print("PDF generated: MoiApp_Cloud_Scalability_Report.pdf")
