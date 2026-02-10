import PDFDocument from 'pdfkit';

export const generateCSVData = (complaints) => {
    const headers = [
        'ID', 'Title', 'Category', 'Priority', 'Status', 
        'Created Date', 'Resolved Date', 'Resolution Time (days)',
        'User', 'Assigned Staff', 'Department', 'Location', 'Votes', 
        'Description', 'Tags', 'Attachments'
    ];
    
    let csv = headers.join(',') + '\n';
    
    complaints.forEach(complaint => {
        const resolvedDate = complaint.status === 'resolved' ? 
            new Date(complaint.updatedAt).toISOString().split('T')[0] : 'N/A';
        
        const createdDate = complaint.createdAt ? 
            new Date(complaint.createdAt).toISOString().split('T')[0] : 'N/A';
        
        const resolutionTime = complaint.status === 'resolved' && complaint.createdAt && complaint.updatedAt ?
            Math.round((new Date(complaint.updatedAt) - new Date(complaint.createdAt)) / (24 * 60 * 60 * 1000)) : 'N/A';
        
        const location = complaint.latitude && complaint.longitude ? 
            `${complaint.latitude},${complaint.longitude}` : 'N/A';
        
        const tags = Array.isArray(complaint.tags) ? 
            complaint.tags.join('; ') : 'N/A';
        
        const attachments = Array.isArray(complaint.attachments) ? 
            complaint.attachments.length : 0;
        
        const escapeCSV = (text) => {
            if (text === null || text === undefined) return '';
            return `"${String(text).replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, ' ')}"`;
        };
        
        const row = [
            escapeCSV(complaint._id),
            escapeCSV(complaint.title),
            escapeCSV(complaint.category),
            escapeCSV(complaint.priority),
            escapeCSV(complaint.status),
            escapeCSV(createdDate),
            escapeCSV(resolvedDate),
            escapeCSV(resolutionTime),
            escapeCSV(complaint.user?.name || 'Anonymous'),
            escapeCSV(complaint.assignedTo?.name || 'Unassigned'),
            escapeCSV(complaint.department || 'General'),
            escapeCSV(location),
            escapeCSV(complaint.votes || 0),
            escapeCSV(complaint.description),
            escapeCSV(tags),
            escapeCSV(attachments)
        ];
        
        csv += row.join(',') + '\n';
    });
    
    // Add summary statistics at the end
    const totalComplaints = complaints.length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in-progress').length;
    const resolutionRate = totalComplaints > 0 ? (resolved / totalComplaints * 100).toFixed(2) : 0;
    
    csv += '\n\nSUMMARY STATISTICS\n';
    csv += `Total Complaints,${totalComplaints}\n`;
    csv += `Resolved,${resolved}\n`;
    csv += `Pending,${pending}\n`;
    csv += `In Progress,${inProgress}\n`;
    csv += `Resolution Rate,${resolutionRate}%\n`;
    csv += `Generated,${new Date().toISOString()}`;
    
    return csv;
};

export const generatePDFReport = async (complaints) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
                info: {
                    Title: 'ResolveX Analytics Report',
                    Author: 'ResolveX System',
                    Subject: 'Complaint Management Analytics',
                    Keywords: 'complaints, analytics, report',
                    CreationDate: new Date()
                }
            });
            
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            
            // Set up colors
            const colors = {
                primary: '#2c3e50',
                secondary: '#3498db',
                success: '#27ae60',
                warning: '#f39c12',
                danger: '#e74c3c',
                light: '#ecf0f1',
                dark: '#34495e'
            };
            
            // Helper function for colored text
            const coloredText = (text, color, x, y) => {
                doc.fillColor(color).text(text, x, y);
                doc.fillColor(colors.dark); // Reset to default
            };
            
            // Helper function for boxes
            const drawBox = (x, y, width, height, color, radius = 5) => {
                doc.roundedRect(x, y, width, height, radius)
                   .fill(color);
            };
            
            // Helper function for section headers
            const sectionHeader = (text, y) => {
                doc.fillColor(colors.primary)
                   .fontSize(18)
                   .font('Helvetica-Bold')
                   .text(text, 50, y);
                doc.fillColor(colors.dark)
                   .fontSize(10);
                return y + 30;
            };
            
            // Helper function for metric card
            const metricCard = (label, value, x, y, width = 120, color = colors.secondary) => {
                const height = 60;
                drawBox(x, y, width, height, colors.light);
                doc.fillColor(colors.primary)
                   .fontSize(14)
                   .font('Helvetica-Bold')
                   .text(value, x + 10, y + 10, { width: width - 20, align: 'center' });
                doc.fillColor(colors.dark)
                   .fontSize(10)
                   .font('Helvetica')
                   .text(label, x + 10, y + 35, { width: width - 20, align: 'center' });
                return height + 10;
            };
            
            // ========== COVER PAGE ==========
            // Background
            drawBox(0, 0, doc.page.width, 150, colors.primary);
            
            // Title
            doc.fillColor('white')
               .fontSize(28)
               .font('Helvetica-Bold')
               .text('RESOLVEX', 50, 60)
               .fontSize(20)
               .text('COMPLAINT ANALYTICS REPORT', 50, 90);
            
            // Subtitle
            doc.fontSize(12)
               .font('Helvetica')
               .text(`Generated on ${new Date().toLocaleDateString('en-US', {
                   weekday: 'long',
                   year: 'numeric',
                   month: 'long',
                   day: 'numeric',
                   hour: '2-digit',
                   minute: '2-digit'
               })}`, 50, 120);
            
            // Report ID
            doc.fontSize(10)
               .text(`Report ID: RX-${Date.now().toString().slice(-8)}`, 50, 140);
            
            // ========== EXECUTIVE SUMMARY ==========
            doc.addPage();
            let yPos = sectionHeader('Executive Summary', 50);
            
            // Calculate statistics
            const totalComplaints = complaints.length;
            const resolved = complaints.filter(c => c.status === 'resolved').length;
            const pending = complaints.filter(c => c.status === 'pending').length;
            const inProgress = complaints.filter(c => c.status === 'in-progress').length;
            const resolutionRate = totalComplaints > 0 ? (resolved / totalComplaints * 100).toFixed(1) : 0;
            
            // Calculate average resolution time
            const resolvedComplaints = complaints.filter(c => c.status === 'resolved' && c.createdAt && c.updatedAt);
            const avgResolutionTime = resolvedComplaints.length > 0 
                ? Math.round(resolvedComplaints.reduce((sum, c) => {
                    return sum + (new Date(c.updatedAt) - new Date(c.createdAt)) / (24 * 60 * 60 * 1000);
                }, 0) / resolvedComplaints.length)
                : 0;
            
            // Top categories
            const categoryStats = complaints.reduce((acc, complaint) => {
                const cat = complaint.category || 'Other';
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {});
            
            const topCategories = Object.entries(categoryStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);
            
            // Priority distribution
            const priorityStats = complaints.reduce((acc, complaint) => {
                const pri = complaint.priority || 'medium';
                acc[pri] = (acc[pri] || 0) + 1;
                return acc;
            }, {});
            
            // Metric Cards (first row)
            let cardY = yPos;
            metricCard('Total Complaints', totalComplaints, 50, cardY);
            metricCard('Resolved', resolved, 190, cardY, 120, colors.success);
            metricCard('Resolution Rate', `${resolutionRate}%`, 330, cardY, 120, colors.warning);
            
            // Metric Cards (second row)
            cardY += 80;
            metricCard('Pending', pending, 50, cardY);
            metricCard('In Progress', inProgress, 190, cardY);
            metricCard('Avg. Resolution', `${avgResolutionTime}d`, 330, cardY, 120, colors.secondary);
            
            // ========== DETAILED ANALYSIS ==========
            yPos = cardY + 90;
            yPos = sectionHeader('Detailed Analysis', yPos);
            
            // Category Breakdown
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('Category Distribution', 50, yPos);
            yPos += 20;
            
            topCategories.forEach(([category, count], index) => {
                const percentage = ((count / totalComplaints) * 100).toFixed(1);
                const barWidth = (count / Math.max(...Object.values(categoryStats))) * 200;
                
                doc.fillColor(colors.dark)
                   .fontSize(10)
                   .font('Helvetica')
                   .text(`${category.charAt(0).toUpperCase() + category.slice(1)}`, 50, yPos)
                   .text(`${count} (${percentage}%)`, 250, yPos);
                
                drawBox(300, yPos - 5, barWidth, 10, colors.secondary);
                yPos += 20;
            });
            
            // Priority Distribution with colors
            yPos += 20;
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('Priority Distribution', 50, yPos);
            yPos += 20;
            
            const priorityColors = {
                critical: colors.danger,
                high: '#e67e22',
                medium: colors.warning,
                low: colors.success
            };
            
            Object.entries(priorityStats).forEach(([priority, count]) => {
                const percentage = ((count / totalComplaints) * 100).toFixed(1);
                doc.fillColor(priorityColors[priority] || colors.dark)
                   .fontSize(10)
                   .font('Helvetica-Bold')
                   .text(priority.toUpperCase(), 50, yPos);
                doc.fillColor(colors.dark)
                   .font('Helvetica')
                   .text(`${count} complaints`, 150, yPos)
                   .text(`${percentage}%`, 250, yPos);
                yPos += 15;
            });
            
            // ========== TIME ANALYSIS ==========
            doc.addPage();
            yPos = sectionHeader('Time Analysis', 50);
            
            // Complaints by creation date (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const complaintsByDay = complaints
                .filter(c => new Date(c.createdAt) >= thirtyDaysAgo)
                .reduce((acc, complaint) => {
                    const date = new Date(complaint.createdAt).toLocaleDateString();
                    acc[date] = (acc[date] || 0) + 1;
                    return acc;
                }, {});
            
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('Daily Complaints (Last 30 Days)', 50, yPos);
            yPos += 20;
            
            Object.entries(complaintsByDay).slice(-10).forEach(([date, count]) => {
                doc.fillColor(colors.dark)
                   .fontSize(10)
                   .font('Helvetica')
                   .text(date, 50, yPos)
                   .text(`${count} complaints`, 200, yPos);
                yPos += 15;
            });
            
            // Resolution Time Analysis
            yPos += 20;
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('Resolution Time Analysis', 50, yPos);
            yPos += 20;
            
            const resolutionTimes = resolvedComplaints.map(c => 
                Math.round((new Date(c.updatedAt) - new Date(c.createdAt)) / (24 * 60 * 60 * 1000))
            );
            
            const timeRanges = [
                { range: '≤ 1 day', max: 1, color: colors.success },
                { range: '2-3 days', min: 2, max: 3, color: '#2ecc71' },
                { range: '4-7 days', min: 4, max: 7, color: colors.warning },
                { range: '8-14 days', min: 8, max: 14, color: '#e67e22' },
                { range: '> 14 days', min: 15, color: colors.danger }
            ];
            
            timeRanges.forEach(({ range, min = 0, max = Infinity, color }) => {
                const count = resolutionTimes.filter(t => t >= min && t <= max).length;
                const percentage = resolved > 0 ? ((count / resolved) * 100).toFixed(1) : 0;
                
                doc.fillColor(color)
                   .fontSize(10)
                   .font('Helvetica-Bold')
                   .text(range, 50, yPos);
                doc.fillColor(colors.dark)
                   .font('Helvetica')
                   .text(`${count} complaints`, 150, yPos)
                   .text(`${percentage}%`, 250, yPos);
                yPos += 15;
            });
            
            // ========== STAFF PERFORMANCE ==========
            yPos += 20;
            doc.fontSize(12)
               .font('Helvetica-Bold')
               .text('Staff Performance', 50, yPos);
            yPos += 20;
            
            const staffPerformance = complaints
                .filter(c => c.assignedTo)
                .reduce((acc, complaint) => {
                    const staffName = complaint.assignedTo.name;
                    if (!acc[staffName]) {
                        acc[staffName] = { total: 0, resolved: 0 };
                    }
                    acc[staffName].total++;
                    if (complaint.status === 'resolved') {
                        acc[staffName].resolved++;
                    }
                    return acc;
                }, {});
            
            Object.entries(staffPerformance).slice(0, 5).forEach(([staff, stats]) => {
                const resolutionRate = stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(0) : 0;
                doc.fillColor(colors.dark)
                   .fontSize(10)
                   .font('Helvetica')
                   .text(staff, 50, yPos, { width: 100 })
                   .text(`${stats.resolved}/${stats.total}`, 160, yPos)
                   .text(`${resolutionRate}%`, 220, yPos);
                yPos += 15;
            });
            
            // ========== RECOMMENDATIONS ==========
            doc.addPage();
            yPos = sectionHeader('Recommendations & Insights', 50);
            
            const recommendations = [
                `• Focus on ${topCategories[0]?.[0] || 'main'} category which has the highest complaint volume`,
                `• Reduce average resolution time from ${avgResolutionTime} days`,
                `• Address ${Object.entries(priorityStats).find(([p]) => p === 'critical')?.[1] || 0} critical priority complaints immediately`,
                `• Improve staff allocation based on resolution rates`,
                `• Implement preventive measures for recurring issues`
            ];
            
            recommendations.forEach((rec, index) => {
                doc.fillColor(colors.dark)
                   .fontSize(11)
                   .font('Helvetica')
                   .text(rec, 70, yPos + (index * 20), { width: 450 });
            });
            
            // ========== FOOTER ==========
            const addFooter = () => {
                const pageHeight = doc.page.height;
                doc.fillColor(colors.primary)
                   .fontSize(8)
                   .font('Helvetica')
                   .text('Confidential - For Internal Use Only', 50, pageHeight - 40)
                   .text(`Page ${doc.page.number} of ${doc.bufferedPageRange().count}`, 
                         450, pageHeight - 40, { align: 'right' })
                   .text(`Generated by ResolveX v1.0`, 50, pageHeight - 25);
            };
            
            // Add footer to all pages
            doc._pageBuffer.forEach((page, i) => {
                doc.switchToPage(i);
                addFooter();
            });
            
            doc.end();
            
        } catch (error) {
            reject(new Error(`Failed to generate PDF report: ${error.message}`));
        }
    });
};

// Optional: Add this helper function for different report types
export const generateReport = async (complaints, type = 'pdf') => {
    switch (type.toLowerCase()) {
        case 'pdf':
            return await generatePDFReport(complaints);
        case 'csv':
            return generateCSVData(complaints);
        case 'json':
            return JSON.stringify({
                metadata: {
                    generated: new Date().toISOString(),
                    total: complaints.length,
                    version: '1.0'
                },
                complaints,
                statistics: calculateStatistics(complaints)
            }, null, 2);
        default:
            throw new Error(`Unsupported report type: ${type}`);
    }
};

// Helper function for statistics (used in JSON export)
const calculateStatistics = (complaints) => {
    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const categories = complaints.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
    }, {});
    
    return {
        total,
        resolved,
        pending: complaints.filter(c => c.status === 'pending').length,
        inProgress: complaints.filter(c => c.status === 'in-progress').length,
        resolutionRate: total > 0 ? (resolved / total * 100).toFixed(2) : 0,
        categories,
        topCategory: Object.entries(categories).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0]
    };
};