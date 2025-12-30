export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
  }
  
  export async function getCategories(supabase: any): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    
    return data || [];
  }