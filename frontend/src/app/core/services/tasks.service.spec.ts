import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TasksService } from './tasks.service';
import { Task } from '../models/task.model';
import { environment } from '../../../environments/environment';

describe('TasksService', () => {
  let service: TasksService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TasksService],
    });
    service = TestBed.inject(TasksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('debe obtener las tareas con filtros', async () => {
    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Tarea A',
        description: null,
        status: 'PENDIENTE',
        priority: 'MEDIA',
        dueDate: null,
        completedAt: null,
        createdAt: '2026-07-31T00:00:00.000Z',
        updatedAt: '2026-07-31T00:00:00.000Z',
      },
    ];
    const promise = service.getTasks({ status: 'PENDIENTE' });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks?status=PENDIENTE`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTasks);

    expect(await promise).toEqual(mockTasks);
  });

  it('debe crear una tarea', async () => {
    const created: Task = {
      id: '2',
      title: 'Nueva tarea',
      description: 'Desc',
      status: 'PENDIENTE',
      priority: 'ALTA',
      dueDate: null,
      completedAt: null,
      createdAt: '2026-07-31T00:00:00.000Z',
      updatedAt: '2026-07-31T00:00:00.000Z',
    };
    const promise = service.createTask({ title: 'Nueva tarea', description: 'Desc', priority: 'ALTA' });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Nueva tarea', description: 'Desc', priority: 'ALTA' });
    req.flush(created);

    expect(await promise).toEqual(created);
  });

  it('debe actualizar una tarea', async () => {
    const updated: Task = {
      id: '2',
      title: 'Nueva tarea',
      description: 'Desc',
      status: 'COMPLETADA',
      priority: 'ALTA',
      dueDate: null,
      completedAt: '2026-07-31T01:00:00.000Z',
      createdAt: '2026-07-31T00:00:00.000Z',
      updatedAt: '2026-07-31T01:00:00.000Z',
    };
    const promise = service.updateTask('2', { status: 'COMPLETADA' });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/2`);
    expect(req.request.method).toBe('PATCH');
    req.flush(updated);

    expect(await promise).toEqual(updated);
  });

  it('debe eliminar una tarea', async () => {
    const promise = service.deleteTask('2');

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Task deleted successfully' });

    expect(await promise).toEqual({ message: 'Task deleted successfully' });
  });
});
