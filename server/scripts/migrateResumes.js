const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cv-optimizer', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const migrateResumes = async () => {
  try {
    console.log('🚀 Starting resume migration...');
    
    // Get the existing resumes collection
    const db = mongoose.connection.db;
    const existingResumes = await db.collection('resumes').find({}).toArray();
    
    console.log(`📄 Found ${existingResumes.length} resumes to migrate`);
    
    if (existingResumes.length === 0) {
      console.log('✅ No resumes to migrate');
      return;
    }
    
    // Create new collection for migrated resumes
    const migratedResumes = existingResumes.map(resume => {
      const newResume = {
        ...resume,
        _id: uuidv4(), // Replace ObjectId with UUID
        originalId: resume._id.toString(), // Keep reference to original ID
        user: resume.user ? resume.user.toString() : null, // Convert user ObjectId to string
        title: resume.name || 'Untitled Resume', // Add title field
        template: 'modern', // Add template field
        downloads: 0 // Add downloads field
      };
      
      // Add IDs to nested arrays
      if (newResume.workExperience) {
        newResume.workExperience = newResume.workExperience.map(exp => ({
          ...exp,
          id: uuidv4(),
          jobTitle: exp.position || exp.jobTitle, // Ensure jobTitle is set
          isCurrentJob: exp.current || exp.isCurrentJob || false
        }));
      }
      
      if (newResume.education) {
        newResume.education = newResume.education.map(edu => ({
          ...edu,
          id: uuidv4(),
          graduationDate: edu.endDate || edu.graduationDate
        }));
      }
      
      if (newResume.projects) {
        newResume.projects = newResume.projects.map(proj => ({
          ...proj,
          id: uuidv4()
        }));
      }
      
      if (newResume.certifications) {
        newResume.certifications = newResume.certifications.map(cert => ({
          ...cert,
          id: uuidv4(),
          issueDate: cert.date || cert.issueDate
        }));
      }
      
      // Convert skills format if needed
      if (newResume.skills && typeof newResume.skills === 'object' && !Array.isArray(newResume.skills)) {
        const technical = newResume.skills.technical || [];
        const soft = newResume.skills.soft || [];
        newResume.skills = [...technical, ...soft];
      }
      
      return newResume;
    });
    
    // Backup existing collection
    console.log('💾 Creating backup of existing resumes...');
    await db.collection('resumes_backup').insertMany(existingResumes);
    
    // Clear existing collection
    console.log('🗑️ Clearing existing resumes collection...');
    await db.collection('resumes').deleteMany({});
    
    // Insert migrated resumes
    console.log('📥 Inserting migrated resumes...');
    await db.collection('resumes').insertMany(migratedResumes);
    
    console.log('✅ Migration completed successfully!');
    console.log(`✅ Migrated ${migratedResumes.length} resumes`);
    console.log('✅ Backup saved to resumes_backup collection');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run migration
migrateResumes();