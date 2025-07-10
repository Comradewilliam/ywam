import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { mockApi } from '../../mock/mockData';
import { toast } from 'react-toastify';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { motion } from 'framer-motion';
import { universityOptions, isValidPhoneNumber } from '../../utils/helpers';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  gender: string;
  university: string;
  course: string;
  dateOfBirth: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '+255',
      gender: '',
      university: '',
      course: '',
      dateOfBirth: '',
    }
  });
  
  const onSubmit = async (data: RegisterFormData) => {
    // Convert names to uppercase
    data.firstName = data.firstName.toUpperCase();
    data.lastName = data.lastName.toUpperCase();
    data.course = data.course.toUpperCase();
    
    setIsLoading(true);
    
    try {
      // Add default role as Friend
      const userData = {
        ...data,
        roles: ['Friend'],
      };
      
      await mockApi.createUser(userData as any);
      toast.success('Registration successful! The admin will set up your account.');
      navigate('/login');
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };
  
  return (
    <motion.div 
      className="max-w-md w-full mx-auto p-6"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <h2 className="text-3xl font-bold text-center mb-6 text-blue-600">Register</h2>
      
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="firstName"
              control={control}
              rules={{ required: 'First name is required' }}
              render={({ field }) => (
                <Input
                  label="First Name"
                  error={errors.firstName?.message}
                  {...field}
                  fullWidth
                />
              )}
            />
            
            <Controller
              name="lastName"
              control={control}
              rules={{ required: 'Last name is required' }}
              render={({ field }) => (
                <Input
                  label="Last Name"
                  error={errors.lastName?.message}
                  {...field}
                  fullWidth
                />
              )}
            />
          </div>
          
          <Controller
            name="phoneNumber"
            control={control}
            rules={{ 
              required: 'Phone number is required',
              validate: value => isValidPhoneNumber(value) || 'Phone must be +255 followed by 9 digits' 
            }}
            render={({ field }) => (
              <Input
                label="Phone Number"
                error={errors.phoneNumber?.message}
                {...field}
                fullWidth
              />
            )}
          />
          
          <Controller
            name="gender"
            control={control}
            rules={{ required: 'Gender is required' }}
            render={({ field }) => (
              <Select
                label="Gender"
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                ]}
                error={errors.gender?.message}
                {...field}
                fullWidth
              />
            )}
          />
          
          <Controller
            name="university"
            control={control}
            rules={{ required: 'University is required' }}
            render={({ field }) => (
              <Select
                label="University"
                options={universityOptions.map(uni => ({ value: uni, label: uni }))}
                error={errors.university?.message}
                {...field}
                fullWidth
              />
            )}
          />
          
          <Controller
            name="course"
            control={control}
            rules={{ required: 'Course is required' }}
            render={({ field }) => (
              <Input
                label="Course"
                error={errors.course?.message}
                {...field}
                fullWidth
              />
            )}
          />
          
          <Controller
            name="dateOfBirth"
            control={control}
            rules={{ required: 'Date of birth is required' }}
            render={({ field }) => (
              <Input
                type="date"
                label="Date of Birth"
                error={errors.dateOfBirth?.message}
                {...field}
                fullWidth
              />
            )}
          />
          
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            fullWidth
            className="mt-6"
          >
            Register
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Already have an account? <a href="/login" className="text-blue-600 hover:underline">Log in</a></p>
        </div>
      </div>
    </motion.div>
  );
};

export default Register;