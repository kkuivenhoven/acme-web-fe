from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse
from django.http import JsonResponse
from poller.models import UserRuns
import json
import os
import datetime

from util.utilities import print_debug
from util.utilities import print_message
from util.utilities import is_json
from util.utilities import timeformat
from run_manager.constants import DIAG_OUTPUT_PREFIX
from run_manager.dispatcher import group_job_update
from run_manager.models import DiagnosticConfig
from web_fe.models import Notification


@csrf_exempt
def update(request):
    if request.method == 'GET':
        try:
            request_type = request.GET.get('request')
            user = request.GET.get('user')
            if not request_type:
                print_message('No request type given')
                return HttpResponse(status=400)

            # request for all jobs
            if request_type == 'all':
                data = get_all(user)
            # request for the next job in the queue
            elif request_type == 'next':
                data = get_next()
                return JsonResponse(data, safe=False)
            # request for jobs that match status
            elif request_type in ['new', 'in_progress', 'complete', 'failed']:
                data = get_job_with_status(request_type, user)
            # request for a specific job
            elif request_type == 'job':
                job_id = request.GET.get('job_id')  # todo: write tests for this
                return get_job(job_id)
            else:
                print_message('Unrecognized request type')
                return HttpResponse(status=400)

            return send_data(data)

        except Exception as e:
            print_debug(e)
            return HttpResponse(status=500)

        print_message('unhandled request')
        return HttpResponse(status=400)

    if request.method == 'POST':
        try:
            print_message(request.body)
            if is_json(request.body):
                data = json.loads(request.body)
            else:
                print_message('request body not json formatted')
                return HttpResponse(status=400)
            request_type = data.get('request')
            if not request_type:
                print_message('no request type given')
                return HttpResponse(status=404)
            if request_type not in ['new', 'in_progress', 'complete', 'failed', 'all', 'delete', 'stop']:
                print_message('Unrecognized request type')
                return HttpResponse(status=400)

            user = data.get('user')
            status = data.get('status')
            job_id = data.get('job_id')

            if request_type == 'stop':
                job_id = data.get('job_id')
                return post_stop(job_id)

            # request to update all of a users jobs to a given status
            if request_type == 'all':
                return post_all(user, status)

            # new job request
            if request_type == 'new':
                return post_new(user, data)
            # request to delete a job
            if request_type == 'delete':
                return post_delete(job_id)
            # request to change the status of an existant job
            if request_type not in ['in_progress', 'complete', 'failed']:
                print_message("Unrecognized request type {}".format(request_type))
                return HttpResponse(status=400)  # Unrecognized request

            if not job_id:
                print_message("no job id")
                return HttpResponse(status=400)

            return post_update(job_id, data, request_type)

        except Exception as e:
            print_debug(e)
            return HttpResponse(status=500)
    else:
        print_message('Http verb {} is not used'.format(request.method))
        return HttpResponse(status=404)


def post_update(job_id, data, request_type):
    try:
        job = UserRuns.objects.get(id=job_id)
        job.status = request_type
        options = json.loads(job.config_options)
        output = data.get('output')
        message = ''
        if is_json(output):
            message = json.loads(output)
        else:
            message = {}
        message['timestamp'] = datetime.datetime.now().strftime(timeformat)
        # Check if the job finished and has output
        # if it does, write it to the db and an output file
        if output:
            job.output = output
            run_type = options.get('run_type')
            print_message('Job finished with output options: {}'.format(options), 'ok')
            outputdir = options.get('output_dir')
            if run_type == 'diagnostic':
                message.update({
                    'run_type': 'diagnostic',
                    'run_name': options.get('run_name'),
                })
            elif run_type == 'model':
                outputdir = options.get('output_dir')
            elif run_type == 'upload_to_viewer':
                job.save()
                message.update(options)
                print_message('Sending job update with message {}'.format(message), 'ok')
                group_job_update(job_id, job.user, request_type, optional_message=message)
                note = Notification.objects.get(user=job.user)
                new_notification = json.dumps({
                    'job_id': job_id,
                    'run_type': run_type,
                    'optional_message': message,
                    'status': request_type,
                    'timestamp': datetime.datetime.now().strftime(timeformat)
                })
                note.notification_list += new_notification + ' -|- '
                note.save()
                return HttpResponse()
            else:
                print_message('Unrecognized run_type: {}'.format(run_type))

            print_message('output dir: {}'.format(outputdir))
            if not os.path.exists(outputdir):
                os.makedirs(outputdir)
            with open(outputdir + '/console_output.txt', 'w+') as output_file:
                output_file.write(' '.join(output))
                output_file.close()

        try:
            job.save()
        except Exception as e:
            print_debug(e)
            print_message('Unable to save job {}'.format(job.__dict__))
        print_message('Sending job update with message {}'.format(message), 'ok')
        note = Notification.objects.get(user=job.user)
        new_notification = json.dumps({
            'job_id': job_id,
            'run_type': options.get('run_type'),
            'optional_message': message,
            'status': request_type,
            'timestamp': datetime.datetime.now().strftime(timeformat)
        })
        note.notification_list += new_notification + ' -|- '
        note.save()
        print_message('Pushing update to client {}'.format(message))
        group_job_update(job_id, job.user, request_type, optional_message=message)
        return HttpResponse(status=200)
    except Exception as e:
        print_debug(e)
        return HttpResponse(status=500)


def post_delete(job_id):
    if not job_id:
        return HttpResponse(status=404)
    try:
        job = UserRuns.objects.get(id=job_id)
        options = json.loads(job.config_options)
        message = {
            'type': 'deleted',
            'timestamp': datetime.datetime.now().strftime(timeformat)
        }
        group_job_update(job_id, job.user, message)
        note = Notification.objects.get(user=job.user)
        new_notification = json.dumps({
            'job_id': job_id,
            'run_type': 'delete',
            'optional_message': {
                'run_name': options.get('run_name'),
                'run_type': options.get('run_type')
            },
            'status': 'deleted',
            'timestamp': datetime.datetime.now().strftime(timeformat)
        })
        note.notification_list += new_notification + ' -|- '
        note.save()
        job.delete()
        return HttpResponse(status=200)
    except Exception as e:
        print_debug(e)
        return HttpResponse(status=400)


def post_new(user, data):
    if not user or not data:
        return HttpResponse(status=400)
    if not data.get('run_type'):
        print_message('No run type')
        return HttpResponse(status=400)
    config = data
    del config['user']
    del config['request']
    run_name = config.get('run_name')
    if not run_name:
        print_message('no run name given, using run type {}'.format(config.get('run_type')))
        run_name = config.get('run_type')
    config['run_name'] = run_name
    if data.get('diag_set'):
        config['set'] = data.get('diag_set')
        del config['diag_set']

    config_json = json.dumps(config)
    print_message('job config:' + config_json, 'ok')

    try:
        new_run = UserRuns.objects.create(
            status='new',
            config_options=config_json,
            user=user
        )
        new_run.save()
    except Exception as e:
        print_debug(e)
        print_message('error saving new run {}'.format(new_run.__dict__))
        return HttpResponse(status=500)

    if run_name != 'upload_to_viewer':
        path = 'userdata/{user}/{run_type}_output/{run_name}_{id}'.format(
            user=user,
            run_type=config.get('run_type'),
            run_name=run_name,
            id=new_run.id
        )
        output_dir = os.path.abspath(path)
        print_message('creating output directory: {}'.format(output_dir))
        try:
            os.makedirs(output_dir)
        except Exception as e:
            print_debug(e)
            print_message('Error creating output directory {}'.format(output_dir))
            return HttpResponse(status=500)
        config['output_dir'] = output_dir

    try:
        new_run.config_options = json.dumps(config)
        new_run.save()
    except Exception as e:
        print_debug(e)
        print_message('error saving new run {}'.format(new_run.__dict__))
        return HttpResponse(status=500)

    if data.get('run_type') == 'diagnostic':
        try:
            diag_config = DiagnosticConfig.objects.filter(user=user, name=run_name).extra(order_by=['version'])
            if diag_config:
                latest = diag_config[len(diag_config) - 1]
                latest.output_path = output_dir
                latest.save()
            else:
                print_message('Unable to find config with name {}'.format(run_name))
                return HttpResponse(status=400)
        except Exception as e:
            print_debug(e)
            print_message('Error saving diagnostic config')
            return HttpResponse(status=500)

    print_message('returning job_id: {}'.format(new_run.id), 'ok')
    response = json.dumps({
        'job_id': new_run.id,
        'dataset_id': 0
    })
    print_message('returning new job response {}'.format(response), 'ok')
    message = {
        'run_name': run_name,
        'run_type': config.get('run_type'),
        'request_attr': config.get('request_attr'),
        'timestamp': datetime.datetime.now().strftime(timeformat)
    }
    print_message(message, 'ok')
    try:
        note = Notification.objects.get(user=new_run.user)
        new_notification = json.dumps({
            'job_id': new_run.id,
            'run_type': config.get('run_type'),
            'optional_message': message,
            'status': 'new',
            'timestamp': datetime.datetime.now().strftime(timeformat)
        })
        note.notification_list += new_notification + ' -|- '
        note.save()
    except Exception, e:
        raise

    print_message('Pushing update to client {}'.format(message))
    group_job_update(new_run.id, new_run.user, 'new', optional_message=message)
    return HttpResponse(response, content_type='application/json')


def post_all(user, status):
    if status not in ['new', 'in_progress', 'complete', 'failed', 'stop']:
        return HttpResponse(status=400)
    if user:
        jobs = UserRuns.objects.filter(user=user)
        for job in jobs:
            job.status = status
            job.save()
        return HttpResponse(status=200)
    else:
        jobs = UserRuns.objects.all()
        for job in jobs:
            job.status = status
            job.save()
        return HttpResponse(status=200)


def post_stop(job_id):
    try:
        job = UserRuns.objects.get(id=job_id)
        job.status = 'stopped'
        job.save()
        options = json.loads(job.config_options)
    except Exception as e:
        print_debug(e)
        return HttpResponse(status=500)
    message = {
        'type': 'stopped',
        'timestamp': datetime.datetime.now().strftime(timeformat)
    }
    group_job_update(job_id, job.user, message)
    try:
        note = Notification.objects.get(user=job.user)
        new_notification = json.dumps({
            'job_id': job_id,
            'run_type': 'stop',
            'optional_message': {
                'run_name': options.get('run_name'),
                'run_type': options.get('run_type')
            },
            'status': 'stopped',
            'timestamp': datetime.datetime.now().strftime(timeformat)
        })
        note.notification_list += new_notification + ' -|- '
        note.save()
    except Exception, e:
        raise
    else:
        pass
    finally:
        pass
    return HttpResponse()


def send_data(data):
    if not data:
        print_message('No jobs found', 'ok')
        return JsonResponse({}, status=200)
    obj_list = []
    for obj in data:
        config = json.loads(obj.config_options)
        obj_dict = {}
        obj_dict['job_id'] = obj.id
        obj_dict['user'] = obj.user
        obj_dict['status'] = obj.status
        obj_dict.update(config)
        obj_list.append(obj_dict)
    return JsonResponse(obj_list, safe=False)


def get_job(job_id):
    if not job_id or not job_id.isdigit():
        return HttpResponse(status=400)
    try:
        data = UserRuns.objects.get(id=job_id)
        config = json.loads(data.config_options)
        obj = {
            'job_id': data.id,
            'user': data.user,
            'status': data.status,
        }
        obj.update(config)
        return JsonResponse(obj, safe=False)
    except Exception as e:
        print_debug(e)
        return JsonResponse({}, status=500)


def get_job_with_status(request_type, user):
    if user:
        data = UserRuns.objects.filter(status=request_type, user=user)
    else:
        data = UserRuns.objects.filter(status=request_type)
    return data


def get_all(user=None):
    if user:
        data = UserRuns.objects.filter(user=user)
    else:
        data = UserRuns.objects.all()
    return data

    try:
        runs = UserRuns.objects.filter(status='new')
        if len(runs) == 0:
            return {}
        data = runs.earliest()
        data.status = 'in_progress'
        data.save()
    except Exception as e:
        print_message('Error getting next job from database')
        print_debug(e)
        return {}
    if not data:
        return {}

    config = json.loads(data.config_options)
    r = {
        'timestamp': datetime.datetime.now().strftime(timeformat),
        'job_id': data.id,
        'user': data.user
    }
    r.update(config)
    group_job_update(data.id, data.user, 'in_progress', optional_message=r)
    try:
        note = Notification.objects.get(user=data.user)
        new_notification = json.dumps({
            'job_id': data.get('id'),
            'run_type': data.get('run_type'),
            'optional_message': r,
            'status': data.get('status'),
            'timestamp': datetime.datetime.now().strftime(timeformat)
        })
        note.notification_list += new_notification + ' -|- '
        note.save()
    except Exception, e:
        raise
    else:
        pass
    finally:
        pass
    return r


def get_next():
    try:
        runs = UserRuns.objects.filter(status='new')
        if len(runs) == 0:
            return {}
        data = runs.earliest()
        data.status = 'in_progress'
        data.save()
    except Exception as e:
        print_message('Error getting next job from database')
        print_debug(e)
        return {}
    if not data:
        return {}

    config = json.loads(data.config_options)
    r = {
        'timestamp': datetime.datetime.now().strftime(timeformat),
        'job_id': data.id,
        'user': data.user
    }
    r.update(config)
    group_job_update(data.id, data.user, 'in_progress', optional_message=r)
    print_message('looking up notification for user {}'.format(data.user))
    try:
        note = Notification.objects.get(user=data.user)
        new_notification = json.dumps({
            'job_id': data.id,
            'run_type': r.get('run_type'),
            'optional_message': r,
            'status': 'in_progress',
            'timestamp': datetime.datetime.now().strftime(timeformat)
        })
        note.notification_list += new_notification + ' -|- '
        note.save()
    except Exception, e:
        raise
    else:
        pass
    finally:
        pass
    return r
