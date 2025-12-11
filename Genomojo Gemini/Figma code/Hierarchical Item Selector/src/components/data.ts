export interface HierarchyItem {
  id: string;
  label: string;
  canSelect: boolean;
  canExpand: boolean;
  children?: HierarchyItem[];
}

export interface Category {
  id: string;
  label: string;
  children: HierarchyItem[];
  color: {
    l0: string;
    l1: string;
    l2: string;
    l3: string;
  };
}

export const hierarchyData: Category[] = [
  {
    id: 'self',
    label: 'Self',
    color: {
      l0: 'bg-violet-600',
      l1: 'bg-violet-400',
      l2: 'bg-violet-200',
      l3: 'bg-violet-100',
    },
    children: [
      {
        id: 'heritage',
        label: 'Heritage',
        canSelect: false,
        canExpand: true,
        children: [
          { id: 'mixed-race', label: 'Mixed Race', canSelect: true, canExpand: false },
          { id: 'black', label: 'Black', canSelect: true, canExpand: false },
          { id: 'white', label: 'White', canSelect: true, canExpand: false },
          { id: 'south-asian', label: 'South Asian', canSelect: true, canExpand: false },
        ]
      },
      {
        id: 'religion',
        label: 'Religion',
        canSelect: false,
        canExpand: true,
        children: [
          { id: 'christian', label: 'Christian', canSelect: true, canExpand: false },
          { id: 'muslim', label: 'Muslim', canSelect: true, canExpand: false },
          { id: 'hindu', label: 'Hindu', canSelect: true, canExpand: false },
          { id: 'jewish', label: 'Jewish', canSelect: true, canExpand: false },
          { id: 'buddhist', label: 'Buddhist', canSelect: true, canExpand: false },
          { id: 'atheist', label: 'Atheist', canSelect: true, canExpand: false },
        ]
      },
      {
        id: 'sexuality',
        label: 'Sexuality',
        canSelect: false,
        canExpand: true,
        children: [
          { id: 'straight', label: 'Straight', canSelect: true, canExpand: false },
          { id: 'gay', label: 'Gay', canSelect: true, canExpand: false },
          { id: 'bisexual', label: 'Bisexual', canSelect: true, canExpand: false },
          { id: 'trans', label: 'Trans', canSelect: true, canExpand: false },
          { id: 'asexual', label: 'Asexual', canSelect: true, canExpand: false },
        ]
      },
    ]
  },
  {
    id: 'people',
    label: 'People',
    color: {
      l0: 'bg-blue-600',
      l1: 'bg-blue-400',
      l2: 'bg-blue-200',
      l3: 'bg-blue-100',
    },
    children: [
      {
        id: 'family',
        label: 'Family',
        canSelect: true,
        canExpand: true,
        children: [
          { id: 'parent', label: 'Parent', canSelect: true, canExpand: false },
          { id: 'sibling', label: 'Sibling', canSelect: true, canExpand: false },
          { id: 'child', label: 'Child', canSelect: true, canExpand: false },
        ]
      },
      {
        id: 'relationships',
        label: 'Relationships',
        canSelect: true,
        canExpand: true,
        children: [
          { id: 'married', label: 'Married', canSelect: true, canExpand: false },
          { id: 'dating', label: 'Dating', canSelect: true, canExpand: false },
          { id: 'single', label: 'Single', canSelect: true, canExpand: false },
        ]
      },
    ]
  },
  {
    id: 'work-study',
    label: 'Work/Study',
    color: {
      l0: 'bg-emerald-600',
      l1: 'bg-emerald-400',
      l2: 'bg-emerald-200',
      l3: 'bg-emerald-100',
    },
    children: [
      {
        id: 'professional',
        label: 'Professional',
        canSelect: true,
        canExpand: true,
        children: [
          { id: 'tech', label: 'Technology', canSelect: true, canExpand: false },
          { id: 'healthcare', label: 'Healthcare', canSelect: true, canExpand: false },
          { id: 'education', label: 'Education', canSelect: true, canExpand: false },
          { id: 'business', label: 'Business', canSelect: true, canExpand: false },
        ]
      },
      {
        id: 'student',
        label: 'Student',
        canSelect: true,
        canExpand: false,
      },
    ]
  },
  {
    id: 'hobbies',
    label: 'Hobbies',
    color: {
      l0: 'bg-orange-600',
      l1: 'bg-orange-400',
      l2: 'bg-orange-200',
      l3: 'bg-orange-100',
    },
    children: [
      {
        id: 'watching-sport',
        label: 'Watching Sport',
        canSelect: true,
        canExpand: true,
        children: [
          { id: 'football-watching', label: 'Football', canSelect: true, canExpand: false },
          { id: 'cricket-watching', label: 'Cricket', canSelect: true, canExpand: false },
          { id: 'tennis-watching', label: 'Tennis', canSelect: true, canExpand: false },
        ]
      },
      {
        id: 'exercise',
        label: 'Exercise',
        canSelect: true,
        canExpand: true,
        children: [
          {
            id: 'running',
            label: 'Running',
            canSelect: true,
            canExpand: true,
            children: [
              { id: 'parkrun', label: 'parkrun', canSelect: true, canExpand: false },
              { id: 'casual-runner', label: 'Casual Runner', canSelect: true, canExpand: false },
              { id: 'club-runner', label: 'Club Runner', canSelect: true, canExpand: false },
              { id: 'marathon-runner', label: 'Marathon Runner', canSelect: true, canExpand: false },
            ]
          },
          { id: 'football', label: 'Football', canSelect: true, canExpand: false },
          { id: 'cricket', label: 'Cricket', canSelect: true, canExpand: false },
          { id: 'swimming', label: 'Swimming', canSelect: true, canExpand: false },
        ]
      },
    ]
  },
];
