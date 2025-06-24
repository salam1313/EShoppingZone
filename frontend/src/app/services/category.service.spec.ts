import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CategoryService]
    });
    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all categories', () => {
    const mockCategories = [{ name: 'Books' }, { name: 'Electronics' }];
    service.getAllCategories().subscribe(categories => {
      expect(categories).toEqual(mockCategories);
    });
    const req = httpMock.expectOne('https://eshoppingzone.onrender.com/api/category');
    expect(req.request.method).toBe('GET');
    req.flush(mockCategories);
  });

  it('should add a category', () => {
    const newCategory = { name: 'Toys' };
    service.addCategory(newCategory).subscribe(res => {
      expect(res).toBeTruthy();
    });
    const req = httpMock.expectOne('https://eshoppingzone.onrender.com/api/category');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });
});
